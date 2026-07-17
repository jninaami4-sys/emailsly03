<?php
namespace Emailsly\Controllers;
use Emailsly\{Database, Response};

final class SiteController
{
    public function content(): void
    {
        $rows = Database::pdo()->query('SELECT `key`, value FROM site_content')->fetchAll();
        $out = [];
        foreach ($rows as $r) $out[$r['key']] = json_decode($r['value'] ?? 'null', true);
        Response::json(['content' => $out]);
    }
    public function settings(): void
    {
        $s = Database::pdo()->query('SELECT * FROM site_settings WHERE id = 1');
        Response::json(['settings' => $s->fetch() ?: null]);
    }
    public function announcements(): void
    {
        $s = Database::pdo()->query(
            'SELECT * FROM announcements
             WHERE is_active = 1
               AND (start_at IS NULL OR start_at <= NOW())
               AND (end_at   IS NULL OR end_at   >= NOW())
             ORDER BY priority DESC, created_at DESC');
        Response::json(['announcements' => $s->fetchAll()]);
    }
    public function socialLinks(): void
    {
        $s = Database::pdo()->query('SELECT * FROM social_links WHERE is_active = 1 ORDER BY sort_order');
        Response::json(['links' => $s->fetchAll()]);
    }
}
