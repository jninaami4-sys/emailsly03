<?php
namespace Emailsly\Controllers\Admin;
use Emailsly\{Auth, Database, Request, Response};
final class SamplesAdmin {
  public function index(): void {
    Auth::requireAdmin();
    Response::json(['samples' => Database::pdo()->query('SELECT * FROM sample_datasets ORDER BY created_at DESC')->fetchAll()]);
  }
  public function create(): void {
    Auth::requireAdmin();
    $b = Request::json();
    $id = Database::uuid();
    Database::pdo()->prepare('INSERT INTO sample_datasets (id,slug,title,description,file_url,file_type,is_public) VALUES (?,?,?,?,?,?,?)')
      ->execute([$id, $b['slug'], $b['title'], $b['description'] ?? null, $b['file_url'], $b['file_type'] ?? 'csv', (int)($b['is_public'] ?? 1)]);
    Response::json(['id' => $id]);
  }
  public function update(array $p): void {
    Auth::requireAdmin();
    $b = Request::json();
    $allow = ['slug','title','description','file_url','file_type','is_public'];
    $f = []; $v = [];
    foreach ($allow as $k) if (array_key_exists($k, $b)) { $f[] = "$k = ?"; $v[] = $b[$k]; }
    if (!$f) Response::error('Nothing to update');
    $v[] = $p['id'];
    Database::pdo()->prepare('UPDATE sample_datasets SET ' . implode(',', $f) . ' WHERE id = ?')->execute($v);
    Response::json(['ok' => true]);
  }
  public function destroy(array $p): void {
    Auth::requireAdmin();
    Database::pdo()->prepare('DELETE FROM sample_datasets WHERE id = ?')->execute([$p['id']]);
    Response::json(['ok' => true]);
  }
}
