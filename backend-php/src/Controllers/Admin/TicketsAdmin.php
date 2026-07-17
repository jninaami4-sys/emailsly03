<?php
namespace Emailsly\Controllers\Admin;
use Emailsly\{Auth, Database, Request, Response};
final class TicketsAdmin {
  public function index(): void {
    Auth::requireAdmin();
    Response::json(['rows' => Database::pdo()->query('SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 500')->fetchAll()]);
  }
  public function update(array $p): void {
    Auth::requireAdmin();
    $b = Request::json();
    if (!$b) Response::error('Empty body');
    $fields = []; $vals = [];
    foreach ($b as $k => $v) {
      if (!preg_match('/^[a-z_][a-z0-9_]*$/', $k)) continue;
      $fields[] = "$k = ?";
      $vals[] = is_array($v) ? json_encode($v) : $v;
    }
    if (!$fields) Response::error('Nothing to update');
    $vals[] = $p['id'];
    Database::pdo()->prepare('UPDATE support_tickets SET ' . implode(',', $fields) . ' WHERE id = ?')->execute($vals);
    Response::json(['ok' => true]);
  }
}
