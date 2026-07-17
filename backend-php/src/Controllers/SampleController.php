<?php
namespace Emailsly\Controllers;
use Emailsly\{Auth, Database, Request, Response};

final class SampleController
{
    public function listPublic(): void
    {
        $s = Database::pdo()->query('SELECT slug,title,description,file_type FROM sample_datasets WHERE is_public = 1');
        Response::json(['samples' => $s->fetchAll()]);
    }
    public function download(array $p): void
    {
        $s = Database::pdo()->prepare('SELECT * FROM sample_datasets WHERE slug = ? AND is_public = 1');
        $s->execute([$p['slug']]);
        $d = $s->fetch();
        if (!$d) Response::notFound('Sample');
        $c = Auth::optionalClaims();
        Database::pdo()->prepare(
            'INSERT INTO sample_dataset_audit (id,dataset_id,user_id,ip_address,user_agent,action) VALUES (?,?,?,?,?, "download")'
        )->execute([
            Database::uuid(), $d['id'], $c['sub'] ?? null,
            Request::ip(), substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
        ]);
        Response::json(['file_url' => $d['file_url'], 'title' => $d['title']]);
    }
}
