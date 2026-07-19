<?php
namespace Emailsly\Controllers;
use Emailsly\{Auth, Database, RateLimit, Request, Response};

final class ReviewController
{
    public function listPublic(): void
    {
        $s = Database::pdo()->query(
            'SELECT id,author_name,author_avatar,rating,title,body,media_url,service_id,created_at
             FROM reviews WHERE status = "approved" ORDER BY featured DESC, approved_at DESC LIMIT 100');
        Response::json(['reviews' => $s->fetchAll()]);
    }
    public function create(): void
    {
        RateLimit::check('review_create', 3, 3600);
        $c = Auth::optionalClaims();
        $b = Request::json();
        Database::pdo()->prepare(
            'INSERT INTO reviews (id,user_id,order_id,author_name,author_email,rating,title,body,service_id,status)
             VALUES (?,?,?,?,?,?,?,?,?, "pending")'
        )->execute([
            Database::uuid(),
            $c['sub'] ?? null,
            $b['order_id'] ?? null,
            $b['author_name'] ?? null,
            $b['author_email'] ?? ($c['email'] ?? null),
            max(1, min(5, (int)($b['rating'] ?? 5))),
            $b['title'] ?? null,
            $b['body'] ?? null,
            $b['service_id'] ?? null,
        ]);
        Response::json(['ok' => true, 'message' => 'Review submitted for moderation']);
    }
}
