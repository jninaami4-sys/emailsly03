<?php
namespace Emailsly\Controllers\Admin;
use Emailsly\{Auth, Database, Request, Response};
final class BlogAdmin {
  public function index(): void {
    Auth::requireAdmin();
    Response::json(['posts' => Database::pdo()->query('SELECT id,slug,title,status,published_at,category,reading_minutes,updated_at FROM blog_posts ORDER BY updated_at DESC')->fetchAll()]);
  }
  public function create(): void {
    $c = Auth::requireAdmin();
    $b = Request::json();
    $id = Database::uuid();
    Database::pdo()->prepare(
      'INSERT INTO blog_posts (id,slug,title,excerpt,body_markdown,body_blocks,cover_image,author_name,author_avatar,category,tags,reading_minutes,status,published_at,meta_title,meta_description,og_image,canonical_url,faq,created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
      $id, $b['slug'], $b['title'], $b['excerpt'] ?? null, $b['body_markdown'] ?? null,
      isset($b['body_blocks']) ? json_encode($b['body_blocks']) : null,
      $b['cover_image'] ?? null, $b['author_name'] ?? null, $b['author_avatar'] ?? null,
      $b['category'] ?? null, isset($b['tags']) ? json_encode($b['tags']) : null,
      (int)($b['reading_minutes'] ?? 0),
      $b['status'] ?? 'draft',
      ($b['status'] ?? 'draft') === 'published' ? ($b['published_at'] ?? date('Y-m-d H:i:s')) : null,
      $b['meta_title'] ?? null, $b['meta_description'] ?? null, $b['og_image'] ?? null, $b['canonical_url'] ?? null,
      isset($b['faq']) ? json_encode($b['faq']) : null, $c['sub'],
    ]);
    Response::json(['id' => $id]);
  }
  public function update(array $p): void {
    Auth::requireAdmin();
    $b = Request::json();
    $allow = ['slug','title','excerpt','body_markdown','body_blocks','cover_image','author_name','author_avatar','category','tags','reading_minutes','status','published_at','meta_title','meta_description','og_image','canonical_url','faq'];
    $fields = []; $vals = [];
    foreach ($allow as $k) if (array_key_exists($k, $b)) {
      $fields[] = "$k = ?";
      $vals[] = in_array($k, ['body_blocks','tags','faq'], true) && $b[$k] !== null ? json_encode($b[$k]) : $b[$k];
    }
    if (!$fields) Response::error('Nothing to update');
    $vals[] = $p['id'];
    Database::pdo()->prepare('UPDATE blog_posts SET ' . implode(',', $fields) . ' WHERE id = ?')->execute($vals);
    Response::json(['ok' => true]);
  }
  public function destroy(array $p): void {
    Auth::requireAdmin();
    Database::pdo()->prepare('DELETE FROM blog_posts WHERE id = ?')->execute([$p['id']]);
    Response::json(['ok' => true]);
  }
  public function showSeo(array $p): void {
    Auth::requireAdmin();
    $s = Database::pdo()->prepare('SELECT * FROM blog_seo_overrides WHERE post_slug = ?');
    $s->execute([$p['postId']]);
    Response::json(['override' => $s->fetch() ?: null]);
  }
  public function upsertSeo(array $p): void {
    Auth::requireAdmin();
    $b = Request::json();
    Database::pdo()->prepare(
      'INSERT INTO blog_seo_overrides (id,post_slug,meta_title,meta_description,og_image,canonical_url) VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE meta_title=VALUES(meta_title), meta_description=VALUES(meta_description), og_image=VALUES(og_image), canonical_url=VALUES(canonical_url)'
    )->execute([Database::uuid(), $p['postId'], $b['meta_title'] ?? null, $b['meta_description'] ?? null, $b['og_image'] ?? null, $b['canonical_url'] ?? null]);
    Response::json(['ok' => true]);
  }
  public function analytics(): void {
    Auth::requireAdmin();
    $s = Database::pdo()->query(
      'SELECT post_slug, event_type, COUNT(*) as n FROM blog_analytics_events
       WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY post_slug, event_type');
    Response::json(['rows' => $s->fetchAll()]);
  }
}
