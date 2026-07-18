<?php
namespace Emailsly\Controllers\Admin;
use Emailsly\{Auth, Database, Request, Response};

final class StoreOffersAdmin
{
    private const F = ['title','subtitle','cta_label','cta_url','coupon_code','discount_pct','bg_color','fg_color','starts_at','ends_at','is_active','sort_order'];

    public function index(): void
    {
        Auth::requireAdmin();
        Response::json(['offers' => Database::pdo()->query('SELECT * FROM store_offers ORDER BY sort_order, id')->fetchAll()]);
    }
    public function create(): void
    {
        Auth::requireAdmin();
        $b = Request::json(); $id = Database::uuid();
        $cols = ['id']; $ph = ['?']; $vals = [$id];
        foreach (self::F as $k) {
            if (array_key_exists($k, $b)) { $cols[] = $k; $ph[] = '?'; $vals[] = $b[$k]; }
        }
        Database::pdo()->prepare('INSERT INTO store_offers (' . implode(',', $cols) . ') VALUES (' . implode(',', $ph) . ')')->execute($vals);
        Response::json(['id' => $id]);
    }
    public function update(array $p): void
    {
        Auth::requireAdmin();
        $b = Request::json(); $set = []; $vals = [];
        foreach (self::F as $k) if (array_key_exists($k, $b)) { $set[] = "$k = ?"; $vals[] = $b[$k]; }
        if (!$set) Response::error('Nothing to update');
        $vals[] = $p['id'];
        Database::pdo()->prepare('UPDATE store_offers SET ' . implode(',', $set) . ' WHERE id = ?')->execute($vals);
        Response::json(['ok' => true]);
    }
    public function destroy(array $p): void
    {
        Auth::requireAdmin();
        Database::pdo()->prepare('DELETE FROM store_offers WHERE id = ?')->execute([$p['id']]);
        Response::json(['ok' => true]);
    }
    public function publicList(): void
    {
        $now = date('Y-m-d H:i:s');
        $s = Database::pdo()->prepare('SELECT * FROM store_offers WHERE is_active = 1 AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at >= ?) ORDER BY sort_order, id');
        $s->execute([$now, $now]);
        Response::json(['offers' => $s->fetchAll()]);
    }
}
