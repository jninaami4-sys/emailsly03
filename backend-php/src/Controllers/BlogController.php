<?php
namespace Emailsly\Controllers;
use Emailsly\{Database, Request, Response};

final class BlogController
{
    public function listPublic(): void
    {
        $s = Database::pdo()->query(
            'SELECT slug,title,excerpt,cover_image,author_name,author_avatar,category,tags,reading_minutes,published_at
             FROM blog_posts WHERE status = "published" ORDER BY published_at DESC LIMIT 100');
        Response::json(['posts' => $s->fetchAll()]);
    }
    public function showBySlug(array $p): void
    {
        $s = Database::pdo()->prepare('SELECT * FROM blog_posts WHERE slug = ? AND status = "published"');
        $s->execute([$p['slug']]);
        $post = $s->fetch();
        if (!$post) Response::notFound('Post');
        $o = Database::pdo()->prepare('SELECT meta_title,meta_description,og_image,canonical_url FROM blog_seo_overrides WHERE post_slug = ?');
        $o->execute([$p['slug']]);
        Response::json(['post' => $post, 'seo_override' => $o->fetch() ?: null]);
    }
    public function trackEvent(): void
    {
        $b = Request::json();
        Database::pdo()->prepare(
            'INSERT INTO blog_analytics_events (id,post_slug,event_type,session_id,ref_url,country,metadata)
             VALUES (?,?,?,?,?,?,?)'
        )->execute([
            \Emailsly\Database::uuid(),
            $b['post_slug'] ?? '',
            $b['event_type'] ?? 'view',
            $b['session_id'] ?? null,
            $b['ref_url'] ?? null,
            $b['country'] ?? null,
            isset($b['metadata']) ? json_encode($b['metadata']) : null,
        ]);
        Response::json(['ok' => true]);
    }
}
