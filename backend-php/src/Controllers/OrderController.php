<?php
namespace Emailsly\Controllers;

use Emailsly\{Auth, Database, Mailer, Request, Response};

final class OrderController
{
    public function listMine(): void
    {
        $c = Auth::requireUser();
        $s = Database::pdo()->prepare(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 200'
        );
        $s->execute([$c['sub']]);
        Response::json(['orders' => $s->fetchAll()]);
    }

    public function create(): void
    {
        $c = Auth::requireUser();
        $b = Request::json();
        $id = Database::uuid();
        $qty = max(1, (int)($b['quantity'] ?? 1));
        $unit = max(0, (int)($b['unit_cents'] ?? 0));
        $sub = $qty * $unit;
        $disc = max(0, (int)($b['discount_cents'] ?? 0));
        $total = max(0, $sub - $disc);
        $customerEmail = $b['customer_email'] ?? $c['email'] ?? null;
        $customerName  = $b['customer_name'] ?? null;
        $service       = $b['service'] ?? null;
        $currency      = $b['currency'] ?? 'USD';
        Database::pdo()->prepare(
            'INSERT INTO orders (id,user_id,service,service_id,quantity,unit_cents,subtotal_cents,discount_cents,total_cents,currency,customer_email,customer_name,notes,metadata,status,payment_status)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, "pending","unpaid")'
        )->execute([
            $id, $c['sub'], $service, $b['service_id'] ?? null,
            $qty, $unit, $sub, $disc, $total,
            $currency,
            $customerEmail,
            $customerName,
            $b['notes'] ?? null,
            isset($b['metadata']) ? json_encode($b['metadata']) : null,
        ]);
        $this->logEvent($id, $c['sub'], 'created', 'Order placed');
        $this->sendOrderConfirmation([
            'id' => $id,
            'service' => $service,
            'quantity' => $qty,
            'total_cents' => $total,
            'currency' => $currency,
            'customer_email' => $customerEmail,
            'customer_name' => $customerName,
            'notes' => $b['notes'] ?? null,
        ]);
        Response::json(['id' => $id]);
    }

    public function show(array $p): void
    {
        $c = Auth::requireUser();
        $s = Database::pdo()->prepare('SELECT * FROM orders WHERE id = ?');
        $s->execute([$p['id']]);
        $o = $s->fetch();
        if (!$o) Response::notFound('Order');
        if ($o['user_id'] !== $c['sub'] && !in_array('admin', $c['roles'] ?? [], true)) {
            Response::forbidden();
        }
        $ev = Database::pdo()->prepare('SELECT * FROM order_events WHERE order_id = ? ORDER BY created_at');
        $ev->execute([$p['id']]);
        $ms = Database::pdo()->prepare('SELECT * FROM order_messages WHERE order_id = ? ORDER BY created_at');
        $ms->execute([$p['id']]);
        Response::json(['order' => $o, 'events' => $ev->fetchAll(), 'messages' => $ms->fetchAll()]);
    }

    public function postMessage(array $p): void
    {
        $c = Auth::requireUser();
        $b = Request::json();
        $body = trim($b['body'] ?? '');
        if (!$body) Response::error('Message body required');
        $s = Database::pdo()->prepare('SELECT user_id FROM orders WHERE id = ?');
        $s->execute([$p['id']]);
        $owner = $s->fetchColumn();
        if (!$owner) Response::notFound('Order');
        $isAdmin = in_array('admin', $c['roles'] ?? [], true);
        if ($owner !== $c['sub'] && !$isAdmin) Response::forbidden();
        Database::pdo()->prepare(
            'INSERT INTO order_messages (id,order_id,sender_id,sender_role,body) VALUES (?,?,?,?,?)'
        )->execute([
            Database::uuid(), $p['id'], $c['sub'],
            $isAdmin ? 'admin' : 'customer',
            $body,
        ]);
        Response::json(['ok' => true]);
    }

    private function logEvent(string $orderId, ?string $actorId, string $type, string $msg): void
    {
        Database::pdo()->prepare(
            'INSERT INTO order_events (id,order_id,actor_id,event_type,message) VALUES (?,?,?,?,?)'
        )->execute([Database::uuid(), $orderId, $actorId, $type, $msg]);
    }

    private function sendOrderConfirmation(array $o): void
    {
        $money = strtoupper($o['currency']) . ' ' . number_format($o['total_cents'] / 100, 2);
        $name  = $o['customer_name'] ?: 'there';
        $svc   = $o['service'] ?: 'your order';
        $ref   = substr($o['id'], 0, 8);
        $appUrl = $_ENV['APP_URL'] ?? '';

        $mailer = Mailer::orders();

        // 1) Customer confirmation
        if (!empty($o['customer_email'])) {
            $body = "Hi $name,\n\n"
                  . "Thanks for your order with Emailsly — we've received it and our team is on it.\n\n"
                  . "Order reference: #$ref\n"
                  . "Service: $svc\n"
                  . "Quantity: {$o['quantity']}\n"
                  . "Total: $money\n\n"
                  . ($appUrl ? "Track your order: $appUrl/orders/{$o['id']}\n\n" : '')
                  . "Reply to this email if you need to add anything.\n\n— The Emailsly Orders Team";
            $mailer->send($o['customer_email'], "Order confirmed · #$ref", $body);
        }

        // 2) Internal copy for admins
        $adminInbox = $_ENV['ORDERS_ADMIN_INBOX'] ?? ($_ENV['ADMIN_EMAIL'] ?? null);
        if ($adminInbox) {
            $adminBody = "New order placed on Emailsly.\n\n"
                       . "Reference: #$ref\n"
                       . "Customer: {$name} <" . ($o['customer_email'] ?: 'n/a') . ">\n"
                       . "Service: $svc\n"
                       . "Quantity: {$o['quantity']}\n"
                       . "Total: $money\n"
                       . ($o['notes'] ? "Notes: {$o['notes']}\n" : '')
                       . ($appUrl ? "\nOpen in admin: $appUrl/admin/orders/{$o['id']}\n" : '');
            $mailer->send($adminInbox, "[Admin] New order #$ref — $money", $adminBody, false, $o['customer_email'] ?: null);
        }
    }
}
