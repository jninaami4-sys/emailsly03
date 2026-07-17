<?php
namespace Emailsly\Controllers\Admin;
use Emailsly\{Auth, Database, Request, Response};
final class SiteAdmin {
  public function listContent(): void {
    Auth::requireAdmin();
    Response::json(['rows' => Database::pdo()->query('SELECT * FROM site_content')->fetchAll()]);
  }
  public function upsertContent(array $p): void {
    $c = Auth::requireAdmin();
    $b = Request::json();
    Database::pdo()->prepare(
      'INSERT INTO site_content (`key`, value, updated_by) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE value = VALUES(value), updated_by = VALUES(updated_by)'
    )->execute([$p['key'], json_encode($b['value'] ?? null), $c['sub']]);
    Response::json(['ok' => true]);
  }
  public function settings(): void {
    Auth::requireAdmin();
    Response::json(['settings' => Database::pdo()->query('SELECT * FROM site_settings WHERE id = 1')->fetch() ?: null]);
  }
  public function updateSettings(): void {
    Auth::requireAdmin();
    $b = Request::json();
    $allow = ['brand_name','brand_tagline','brand_logo_url','brand_logo_white_url','favicon_url','support_show_category','contact_email','contact_phone'];
    $fields = []; $vals = [];
    foreach ($allow as $k) if (array_key_exists($k, $b)) { $fields[] = "$k = ?"; $vals[] = $b[$k]; }
    if ($fields) {
      Database::pdo()->prepare('UPDATE site_settings SET ' . implode(',', $fields) . ' WHERE id = 1')->execute($vals);
    }
    Response::json(['ok' => true]);
  }
  public function listSocial(): void {
    Auth::requireAdmin();
    Response::json(['links' => Database::pdo()->query('SELECT * FROM social_links ORDER BY sort_order')->fetchAll()]);
  }
  public function upsertSocial(array $p): void {
    Auth::requireAdmin();
    $b = Request::json();
    $exists = Database::pdo()->prepare('SELECT id FROM social_links WHERE id = ?');
    $exists->execute([$p['id']]);
    if ($exists->fetch()) {
      $allow = ['platform','url','label','icon','sort_order','is_active'];
      $f = []; $v = [];
      foreach ($allow as $k) if (array_key_exists($k, $b)) { $f[] = "$k = ?"; $v[] = $b[$k]; }
      $v[] = $p['id'];
      Database::pdo()->prepare('UPDATE social_links SET ' . implode(',', $f) . ' WHERE id = ?')->execute($v);
    } else {
      Database::pdo()->prepare('INSERT INTO social_links (id,platform,url,label,icon,sort_order,is_active) VALUES (?,?,?,?,?,?,?)')
        ->execute([$p['id'], $b['platform'] ?? '', $b['url'] ?? '', $b['label'] ?? null, $b['icon'] ?? null, (int)($b['sort_order'] ?? 0), (int)($b['is_active'] ?? 1)]);
    }
    Response::json(['ok' => true]);
  }
}
