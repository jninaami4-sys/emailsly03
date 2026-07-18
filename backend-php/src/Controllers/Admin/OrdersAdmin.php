<?php
namespace Emailsly\Controllers\Admin;
use Emailsly\{Auth, Database, Request, Response};

final class OrdersAdmin
{
    public function index(): void
    {
        Auth::requireAdmin();
        $status = Request::query('status');
        $q = 'SELECT o.*, p.full_name AS customer_full_name FROM orders o
              LEFT JOIN profiles p ON p.user_id = o.user_id';
        $args = [];
        if ($status) { $q .= ' WHERE o.status = ?'; $args[] = $status; }
        $q .= ' ORDER BY o.created_at DESC LIMIT 500';
        $s = Database::pdo()->prepare($q); $s->execute($args);
        Response::json(['orders' => $s->fetchAll()]);
    }
    public function create(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $id = Database::uuid();
        $qty = max(1, (int)($b['quantity'] ?? 1));
        $unit = max(0, (int)($b['unit_cents'] ?? 0));
        $sub = $qty * $unit;
        $disc = max(0, (int)($b['discount_cents'] ?? 0));
        $total = max(0, $sub - $disc);
        Database::pdo()->prepare(
            'INSERT INTO orders (id,user_id,service,service_id,quantity,unit_cents,subtotal_cents,discount_cents,total_cents,currency,customer_email,customer_name,notes,status,payment_status,created_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, COALESCE(?, NOW()))'
        )->execute([
            $id, $b['user_id'] ?? null, $b['service'] ?? null, $b['service_id'] ?? null,
            $qty, $unit, $sub, $disc, $total, $b['currency'] ?? 'USD',
            $b['customer_email'] ?? null, $b['customer_name'] ?? null, $b['notes'] ?? null,
            $b['status'] ?? 'pending', $b['payment_status'] ?? 'unpaid',
            $b['created_at'] ?? null,
        ]);
        Response::json(['id' => $id]);
    }
    public function update(array $p): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $allow = ['status','payment_status','service','quantity','unit_cents','discount_cents','total_cents','notes','customer_email','customer_name','cancel_reason','refund_reason','paid_at','cancelled_at','refunded_at','delivered_at'];
        $fields = []; $vals = [];
        foreach ($allow as $k) {
            if (array_key_exists($k, $b)) { $fields[] = "$k = ?"; $vals[] = $b[$k]; }
        }
        if (!$fields) Response::error('Nothing to update');
        $vals[] = $p['id'];
        Database::pdo()->prepare('UPDATE orders SET ' . implode(',', $fields) . ' WHERE id = ?')->execute($vals);
        Response::json(['ok' => true]);
    }
    public function destroy(array $p): void
    {
        Auth::requireAdmin();
        Database::pdo()->prepare('DELETE FROM orders WHERE id = ?')->execute([$p['id']]);
        Response::json(['ok' => true]);
    }

    /** Bulk actions: {ids: string[], action: 'archive'|'restore'|'delete'|'cancel'|'deliver'} */
    public function bulk(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $ids = array_values(array_filter((array)($b['ids'] ?? []), 'is_string'));
        $action = (string)($b['action'] ?? '');
        if (!$ids) Response::error('No ids');
        $ph = implode(',', array_fill(0, count($ids), '?'));
        $pdo = Database::pdo();
        switch ($action) {
            case 'archive':
                $pdo->prepare("UPDATE orders SET status='archived' WHERE id IN ($ph)")->execute($ids);
                break;
            case 'restore':
                $pdo->prepare("UPDATE orders SET status='pending' WHERE id IN ($ph) AND status='archived'")->execute($ids);
                break;
            case 'delete':
                $pdo->prepare("DELETE FROM orders WHERE id IN ($ph)")->execute($ids);
                break;
            case 'cancel':
                $pdo->prepare("UPDATE orders SET status='cancelled', cancelled_at = NOW() WHERE id IN ($ph)")->execute($ids);
                break;
            case 'deliver':
                $pdo->prepare("UPDATE orders SET status='delivered', delivered_at = NOW() WHERE id IN ($ph)")->execute($ids);
                break;
            default:
                Response::error('Unknown action');
        }
        Response::json(['ok' => true, 'count' => count($ids)]);
    }

    public function events(array $p): void
    {
        Auth::requireAdmin();
        $s = Database::pdo()->prepare('SELECT * FROM order_events WHERE order_id = ? ORDER BY created_at DESC');
        $s->execute([$p['id']]);
        Response::json(['events' => $s->fetchAll()]);
    }

    public function messages(array $p): void
    {
        Auth::requireAdmin();
        $s = Database::pdo()->prepare('SELECT * FROM order_messages WHERE order_id = ? ORDER BY created_at ASC');
        $s->execute([$p['id']]);
        Response::json(['messages' => $s->fetchAll()]);
    }

    public function postMessage(array $p): void
    {
        $claims = Auth::requireAdmin();
        $b = Request::json();
        $id = Database::uuid();
        Database::pdo()->prepare(
            'INSERT INTO order_messages (id, order_id, sender_id, sender_role, body, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())'
        )->execute([$id, $p['id'], $claims['sub'] ?? null, 'admin', (string)($b['body'] ?? '')]);
        Response::json(['id' => $id]);
    }
}
