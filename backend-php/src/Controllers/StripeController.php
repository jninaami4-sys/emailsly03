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
        if (!$this->verifyStripeSig($raw, $sig, $secret)) Response::unauthorized('Bad signature');
        $ev = json_decode($raw, true);
        if (!$ev || !isset($ev['id'])) Response::error('Bad payload');
        // Idempotency
        try {
            Database::pdo()->prepare('INSERT INTO stripe_events (id,type,payload) VALUES (?,?,?)')
                ->execute([$ev['id'], $ev['type'] ?? '', $raw]);
        } catch (\PDOException) { Response::json(['ok' => true, 'dup' => true]); }

        if (($ev['type'] ?? '') === 'checkout.session.completed') {
            $obj = $ev['data']['object'];
            $orderId = $obj['client_reference_id'] ?? null;
            if ($orderId) {
                Database::pdo()->prepare(
                    'UPDATE orders SET payment_status = "paid", paid_at = NOW(), payment_ref = ?, status = IF(status = "pending","confirmed",status) WHERE id = ?'
                )->execute([$obj['id'], $orderId]);
            }
        }
        Response::json(['ok' => true]);
    }

    private function verifyStripeSig(string $raw, string $sigHeader, string $secret): bool
    {
        if (!$secret || !$sigHeader) return false;
        $parts = [];
        foreach (explode(',', $sigHeader) as $kv) {
            [$k, $v] = array_pad(explode('=', trim($kv), 2), 2, '');
            $parts[$k][] = $v;
        }
        $ts = $parts['t'][0] ?? '';
        $sigs = $parts['v1'] ?? [];
        $expected = hash_hmac('sha256', "$ts.$raw", $secret);
        foreach ($sigs as $s) if (hash_equals($expected, $s)) return true;
        return false;
    }
}
