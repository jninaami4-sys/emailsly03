<?php
namespace Emailsly\Controllers;

use Emailsly\{Auth, Database, Request, Response};

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
        Database::pdo()->prepare(
            'INSERT INTO orders (id,user_id,service,service_id,quantity,unit_cents,subtotal_cents,discount_cents,total_cents,currency,customer_email,customer_name,notes,metadata,status,payment_status)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, "pending","unpaid")'
        )->execute([
            $id, $c['sub'], $b['service'] ?? null, $b['service_id'] ?? null,
            $qty, $unit, $sub, $disc, $total,
            $b['currency'] ?? 'USD',
            $b['customer_email'] ?? $c['email'] ?? null,
            $b['customer_name'] ?? null,
            $b['notes'] ?? null,
            isset($b['metadata']) ? json_encode($b['metadata']) : null,
        ]);
        $this->logEvent($id, $c['sub'], 'created', 'Order placed');
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
}
