<?php
namespace Emailsly\Controllers\Admin;
use Emailsly\{Auth, Database, Request, Response};

final class ProductsAdmin
{
    private const F = ['slug','name','short_desc','long_desc','price_cents','compare_at_cents','currency','status','category','tags','image_url','gallery','bullets','metadata','sort_order','is_featured'];

    public function index(): void
    {
        Auth::requireAdmin();
        $s = Database::pdo()->query('SELECT * FROM custom_products ORDER BY sort_order, created_at DESC');
        Response::json(['products' => $s->fetchAll()]);
    }
    public function create(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $id = Database::uuid();
        $cols = ['id']; $ph = ['?']; $vals = [$id];
        foreach (self::F as $k) {
            if (array_key_exists($k, $b)) {
                $cols[] = $k; $ph[] = '?';
                $vals[] = is_array($b[$k]) ? json_encode($b[$k]) : $b[$k];
            }
        }
        Database::pdo()->prepare('INSERT INTO custom_products (' . implode(',', $cols) . ') VALUES (' . implode(',', $ph) . ')')->execute($vals);
        Response::json(['id' => $id]);
    }
    public function update(array $p): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $set = []; $vals = [];
        foreach (self::F as $k) {
            if (array_key_exists($k, $b)) {
                $set[] = "$k = ?";
                $vals[] = is_array($b[$k]) ? json_encode($b[$k]) : $b[$k];
            }
        }
        if (!$set) Response::error('Nothing to update');
        $vals[] = $p['id'];
        Database::pdo()->prepare('UPDATE custom_products SET ' . implode(',', $set) . ' WHERE id = ?')->execute($vals);
        Response::json(['ok' => true]);
    }
    public function destroy(array $p): void
    {
        Auth::requireAdmin();
        Database::pdo()->prepare('DELETE FROM custom_products WHERE id = ?')->execute([$p['id']]);
        Response::json(['ok' => true]);
    }
}
