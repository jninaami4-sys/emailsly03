<?php
namespace Emailsly\Controllers\Admin;
use Emailsly\{Auth, Database, Request, Response};
final class PricingAdmin {
  public function index(): void {
    Auth::requireAdmin();
    Response::json(['services' => Database::pdo()->query('SELECT * FROM pricing_settings ORDER BY sort_order, name')->fetchAll()]);
  }
  public function update(array $p): void {
    $c = Auth::requireAdmin();
    $b = Request::json();
    $pdo = Database::pdo();
    $old = $pdo->prepare('SELECT * FROM pricing_settings WHERE id = ?'); $old->execute([$p['id']]);
    $oldRow = $old->fetch();
    if (!$oldRow) Response::notFound();
    $allow = ['name','category','rate','min_qty','min_order','helper','currency','published','sort_order'];
    $fields = []; $vals = []; $diff = [];
    foreach ($allow as $k) if (array_key_exists($k, $b) && $b[$k] != $oldRow[$k]) {
        $fields[] = "$k = ?"; $vals[] = $b[$k]; $diff[$k] = ['old' => $oldRow[$k], 'new' => $b[$k]];
    }
    if (!$fields) Response::json(['ok' => true]);
    $vals[] = $p['id'];
    $pdo->prepare('UPDATE pricing_settings SET ' . implode(',', $fields) . ' WHERE id = ?')->execute($vals);
    $pdo->prepare('INSERT INTO pricing_settings_audit (id,service_id,service_name,changed_by,changed_by_email,changes) VALUES (?,?,?,?,?,?)')
      ->execute([Database::uuid(), $oldRow['service_id'], $oldRow['name'], $c['sub'], $c['email'] ?? null, json_encode($diff)]);
    Response::json(['ok' => true]);
  }
}
