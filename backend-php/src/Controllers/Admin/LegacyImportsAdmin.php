<?php
namespace Emailsly\Controllers\Admin;
use Emailsly\{Auth, Database, Request, Response};

/**
 * Legacy order imports (CSV).
 * Expected columns: order_date, customer_email, customer_name, service, quantity, unit_cents, discount_cents, total_cents, currency, status, payment_status, payment_ref, notes
 */
final class LegacyImportsAdmin
{
    public function index(): void
    {
        Auth::requireAdmin();
        $s = Database::pdo()->query('SELECT * FROM legacy_order_imports ORDER BY created_at DESC LIMIT 100');
        Response::json(['batches' => $s->fetchAll()]);
    }

    public function import(): void
    {
        $claims = Auth::requireAdmin();
        $b = Request::json();
        $rows = (array)($b['rows'] ?? []);
        if (!$rows) Response::error('No rows');
        $batchId = Database::uuid();
        $success = 0; $errors = [];
        $ins = Database::pdo()->prepare(
            'INSERT INTO orders (id,user_id,service,quantity,unit_cents,subtotal_cents,discount_cents,total_cents,currency,customer_email,customer_name,notes,status,payment_status,payment_ref,created_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,COALESCE(?, NOW()))'
        );
        foreach ($rows as $i => $r) {
            try {
                $qty = max(1, (int)($r['quantity'] ?? 1));
                $unit = (int)($r['unit_cents'] ?? 0);
                $disc = (int)($r['discount_cents'] ?? 0);
                $sub = $qty * $unit;
                $total = (int)($r['total_cents'] ?? max(0, $sub - $disc));
                $ins->execute([
                    Database::uuid(), null, $r['service'] ?? 'legacy', $qty, $unit, $sub, $disc, $total,
                    $r['currency'] ?? 'USD', $r['customer_email'] ?? null, $r['customer_name'] ?? null,
                    $r['notes'] ?? null, $r['status'] ?? 'delivered', $r['payment_status'] ?? 'paid',
                    $r['payment_ref'] ?? null, $r['order_date'] ?? null,
                ]);
                $success++;
            } catch (\Throwable $e) {
                $errors[] = ['row' => $i, 'error' => $e->getMessage()];
            }
        }
        Database::pdo()->prepare(
            'INSERT INTO legacy_order_imports (id, batch_ref, imported_by, row_count, success_count, error_count, errors, created_at)
             VALUES (?,?,?,?,?,?,?, NOW())'
        )->execute([$batchId, $b['batch_ref'] ?? null, $claims['sub'] ?? null, count($rows), $success, count($errors), json_encode($errors)]);
        Response::json(['batch_id' => $batchId, 'imported' => $success, 'errors' => $errors]);
    }
}
