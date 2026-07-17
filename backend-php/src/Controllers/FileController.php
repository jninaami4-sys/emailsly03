<?php
namespace Emailsly\Controllers;
use Emailsly\{Auth, Response};

final class FileController
{
    private const BUCKETS = ['avatars','reviews','announcements','samples'];
    private const MAX_BYTES = 10 * 1024 * 1024;
    private const ALLOWED = [
        'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif',
        'text/csv' => 'csv', 'application/vnd.ms-excel' => 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
        'application/pdf' => 'pdf',
    ];

    public function upload(): void
    {
        Auth::requireUser();
        $bucket = $_POST['bucket'] ?? '';
        if (!in_array($bucket, self::BUCKETS, true)) Response::error('Invalid bucket');
        if (!isset($_FILES['file'])) Response::error('No file');
        $f = $_FILES['file'];
        if ($f['error'] !== UPLOAD_ERR_OK) Response::error('Upload failed: ' . $f['error']);
        if ($f['size'] > self::MAX_BYTES) Response::error('File too large (max 10 MB)');
        $mime = mime_content_type($f['tmp_name']) ?: '';
        if (!isset(self::ALLOWED[$mime])) Response::error("Unsupported type: $mime");
        $ext = self::ALLOWED[$mime];
        $name = bin2hex(random_bytes(16)) . '.' . $ext;
        $dir = dirname(__DIR__, 2) . "/uploads/$bucket";
        if (!is_dir($dir)) mkdir($dir, 0750, true);
        move_uploaded_file($f['tmp_name'], "$dir/$name");
        $url = ($_ENV['API_URL'] ?? '') . "/api/files/$bucket/$name";
        Response::json(['url' => $url, 'name' => $name, 'bucket' => $bucket]);
    }

    public function serve(array $p): void
    {
        $bucket = $p['bucket'];
        $name = basename($p['name']);
        if (!in_array($bucket, self::BUCKETS, true)) Response::notFound();
        $path = dirname(__DIR__, 2) . "/uploads/$bucket/$name";
        if (!is_file($path)) Response::notFound();
        header('Content-Type: ' . (mime_content_type($path) ?: 'application/octet-stream'));
        header('Content-Length: ' . filesize($path));
        header('Cache-Control: public, max-age=31536000, immutable');
        readfile($path);
        exit;
    }
}
