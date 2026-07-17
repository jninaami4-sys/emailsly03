<?php
namespace Emailsly\Controllers;
use Emailsly\{Auth, Database, Request, Response};

final class StripeController
{
    public function createCheckout(): void
    {
        $c = Auth::requireUser();
        $b = Request::json();
        $orderId = $b['order_id'] ?? '';
        $s = Database::pdo()->prepare('SELECT id,total_cents,currency,service FROM orders WHERE id = ? AND user_id = ?');
        $s->execute([$orderId, $c['sub']]);
        $o = $s->fetch();
        if (!$o) Response::notFound('Order');

        $sk = $_ENV['STRIPE_SECRET_KEY'] ?? '';
        if (!$sk) Response::error('Stripe not configured', 500);

        $payload = http_build_query([
            'mode' => 'payment',
            'success_url' => ($_ENV['APP_URL'] ?? '') . '/orders/' . $orderId . '?paid=1',
            'cancel_url'  => ($_ENV['APP_URL'] ?? '') . '/orders/' . $orderId,
            'client_reference_id' => $orderId,
            'customer_email' => $c['email'] ?? null,
            'line_items[0][price_data][currency]' => strtolower($o['currency']),
            'line_items[0][price_data][unit_amount]' => (int)$o['total_cents'],
            'line_items[0][price_data][product_data][name]' => $o['service'] ?: 'Emailsly Order',
            'line_items[0][quantity]' => 1,
        ]);

        $ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => ["Authorization: Bearer $sk"],
            CURLOPT_RETURNTRANSFER => true,
        ]);
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $d = json_decode($resp ?: '{}', true);
        if ($code >= 400) Response::error($d['error']['message'] ?? 'Stripe error', 500);
        Database::pdo()->prepare('UPDATE orders SET payment_provider = "stripe", payment_ref = ? WHERE id = ?')
            ->execute([$d['id'], $orderId]);
        Response::json(['url' => $d['url'], 'session_id' => $d['id']]);
    }

    public function webhook(): void
    {
        $raw = file_get_contents('php://input') ?: '';
        $sig = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        $secret = $_ENV['STRIPE_WEBHOOK_SECRET'] ?? '';
        $tolerance = (int)($_ENV['STRIPE_WEBHOOK_TOLERANCE'] ?? 300);
        if (!$this->verifyStripeSig($raw, $sig, $secret, $tolerance)) {
            Response::unauthorized('Bad signature');
        }
        $ev = json_decode($raw, true);
        if (!$ev || !isset($ev['id'])) Response::error('Bad payload');

        // Idempotency — first insert wins; duplicates return 200 so Stripe stops retrying.
        try {
            Database::pdo()->prepare('INSERT INTO stripe_events (id,type,payload) VALUES (?,?,?)')
                ->execute([$ev['id'], $ev['type'] ?? '', $raw]);
        } catch (\PDOException) { Response::json(['ok' => true, 'dup' => true]); return; }

        try {
            $this->handleEvent($ev);
        } catch (\Throwable $e) {
            error_log('[stripe-webhook] ' . $e->getMessage());
            Response::error('Handler failure', 500);
            return;
        }
        Response::json(['ok' => true]);
    }

    /** Route Stripe events to order status updates. */
    private function handleEvent(array $ev): void
    {
        $type = $ev['type'] ?? '';
        $obj  = $ev['data']['object'] ?? [];

        switch ($type) {
            case 'checkout.session.completed':
                // Only mark paid when payment actually cleared (async methods may still be pending).
                if (($obj['payment_status'] ?? '') === 'paid') {
                    $this->markOrderPaid(
                        $this->resolveOrderId($obj),
                        $obj['payment_intent'] ?? $obj['id'] ?? null,
                        $type
                    );
                }
                break;

            case 'checkout.session.async_payment_succeeded':
            case 'payment_intent.succeeded':
                $this->markOrderPaid(
                    $this->resolveOrderId($obj),
                    $obj['id'] ?? null,
                    $type
                );
                break;

            case 'checkout.session.async_payment_failed':
            case 'checkout.session.expired':
            case 'payment_intent.payment_failed':
            case 'payment_intent.canceled':
                $reason = $obj['last_payment_error']['message']
                    ?? $obj['cancellation_reason']
                    ?? ($type === 'checkout.session.expired' ? 'Checkout session expired' : 'Payment failed');
                $this->markOrderFailed(
                    $this->resolveOrderId($obj),
                    $obj['id'] ?? null,
                    $reason,
                    $type
                );
                break;

            case 'charge.refunded':
            case 'charge.refund.updated':
                $orderId = $this->resolveOrderId($obj)
                    ?? $this->orderIdFromPaymentRef($obj['payment_intent'] ?? null);
                if ($orderId) $this->markOrderRefunded($orderId, $obj['id'] ?? null, $type);
                break;
        }
    }

    private function resolveOrderId(array $obj): ?string
    {
        return $obj['client_reference_id']
            ?? ($obj['metadata']['order_id'] ?? null)
            ?? null;
    }

    private function orderIdFromPaymentRef(?string $ref): ?string
    {
        if (!$ref) return null;
        $s = Database::pdo()->prepare('SELECT id FROM orders WHERE payment_ref = ? LIMIT 1');
        $s->execute([$ref]);
        $r = $s->fetch();
        return $r['id'] ?? null;
    }

    private function markOrderPaid(?string $orderId, ?string $ref, string $eventType): void
    {
        if (!$orderId) return;
        $pdo = Database::pdo();
        $upd = $pdo->prepare(
            'UPDATE orders
                SET payment_status = "paid",
                    paid_at = COALESCE(paid_at, NOW()),
                    payment_provider = "stripe",
                    payment_ref = COALESCE(?, payment_ref),
                    status = IF(status = "pending", "confirmed", status),
                    updated_at = NOW()
              WHERE id = ? AND payment_status <> "paid"'
        );
        $upd->execute([$ref, $orderId]);
        if ($upd->rowCount() > 0) {
            $this->logOrderEvent($orderId, 'payment_succeeded', 'Payment succeeded via Stripe', $eventType, $ref);
        }
    }

    private function markOrderFailed(?string $orderId, ?string $ref, string $reason, string $eventType): void
    {
        if (!$orderId) return;
        $pdo = Database::pdo();
        $upd = $pdo->prepare(
            'UPDATE orders
                SET payment_status = "failed",
                    payment_provider = "stripe",
                    payment_ref = COALESCE(?, payment_ref),
                    updated_at = NOW()
              WHERE id = ? AND payment_status NOT IN ("paid","refunded")'
        );
        $upd->execute([$ref, $orderId]);
        if ($upd->rowCount() > 0) {
            $this->logOrderEvent($orderId, 'payment_failed', $reason, $eventType, $ref);
        }
    }

    private function markOrderRefunded(string $orderId, ?string $ref, string $eventType): void
    {
        $pdo = Database::pdo();
        $upd = $pdo->prepare(
            'UPDATE orders
                SET payment_status = "refunded",
                    status = "cancelled",
                    updated_at = NOW()
              WHERE id = ? AND payment_status <> "refunded"'
        );
        $upd->execute([$orderId]);
        if ($upd->rowCount() > 0) {
            $this->logOrderEvent($orderId, 'payment_refunded', 'Stripe refund processed', $eventType, $ref);
        }
    }

    private function logOrderEvent(string $orderId, string $eventType, string $message, string $stripeType, ?string $ref): void
    {
        try {
            $meta = json_encode(['stripe_event' => $stripeType, 'ref' => $ref], JSON_UNESCAPED_SLASHES);
            $stmt = Database::pdo()->prepare(
                'INSERT INTO order_events (id, order_id, event_type, message, metadata)
                 VALUES (UUID(), ?, ?, ?, ?)'
            );
            $stmt->execute([$orderId, $eventType, $message, $meta]);
        } catch (\Throwable $e) {
            error_log('[stripe-webhook] order_event log failed: ' . $e->getMessage());
        }
    }

    private function verifyStripeSig(string $raw, string $sigHeader, string $secret, int $tolerance = 300): bool
    {
        if (!$secret || !$sigHeader) return false;
        $parts = [];
        foreach (explode(',', $sigHeader) as $kv) {
            [$k, $v] = array_pad(explode('=', trim($kv), 2), 2, '');
            $parts[$k][] = $v;
        }
        $ts = $parts['t'][0] ?? '';
        $sigs = $parts['v1'] ?? [];
        if ($ts === '' || empty($sigs)) return false;
        if ($tolerance > 0 && abs(time() - (int)$ts) > $tolerance) return false;
        $expected = hash_hmac('sha256', "$ts.$raw", $secret);
        foreach ($sigs as $s) if (hash_equals($expected, $s)) return true;
        return false;
    }
}
