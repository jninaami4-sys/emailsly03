<?php
namespace Emailsly\Controllers\Admin;
use Emailsly\{Auth, Database, Request, Response};
final class ReviewsAdmin {
  public function index(): void {
    Auth::requireAdmin();
    Response::json(['rows' => Database::pdo()->query('SELECT * FROM reviews ORDER BY created_at DESC LIMIT 500')->fetchAll()]);
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
    Database::pdo()->prepare('UPDATE reviews SET ' . implode(',', $fields) . ' WHERE id = ?')->execute($vals);
    Response::json(['ok' => true]);
  }
  public function create(): void {
    Auth::requireAdmin();
    $b = Request::json();
    $id = Database::uuid();
    $cols = ['id']; $vals = [$id]; $ph = ['?'];
    foreach ($b as $k => $v) {
      if (!preg_match('/^[a-z_][a-z0-9_]*$/', $k)) continue;
      $cols[] = $k; $ph[] = '?';
      $vals[] = is_array($v) ? json_encode($v) : $v;
    }
    Database::pdo()->prepare('INSERT INTO reviews (' . implode(',', $cols) . ') VALUES (' . implode(',', $ph) . ')')->execute($vals);
    Response::json(['id' => $id]);
  }
  public function destroy(array $p): void {
    Auth::requireAdmin();
    Database::pdo()->prepare('DELETE FROM reviews WHERE id = ?')->execute([$p['id']]);
    Response::json(['ok' => true]);
  }
}
