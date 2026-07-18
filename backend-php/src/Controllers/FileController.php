<?php
namespace Emailsly\Controllers;
use Emailsly\{Auth, Response};

/**
 * File uploads.
 *
 * Files are written to /public_html/uploads/{bucket}/{yyyy}/{mm}/{name}
 * and served by Apache directly (no PHP roundtrip). The FileController::serve
 * route below is only a fallback for the case where the uploads directory
 * is NOT under public_html (e.g. sandboxed hosting).
 *
 * Any authenticated user may upload to `avatars` and `reviews`; the rest
 * require admin role.
 */
final class FileController
{
    private const PUBLIC_BUCKETS = ['avatars', 'reviews'];
    private const ADMIN_BUCKETS  = [
        'brand-assets',
        'announcement-media',
        'sample-datasets',
        'blog-images',
        'product-images',
        'site-content',
    ];

    private const ALLOWED_IMAGE = [
        'image/jpeg' => 'jpg', 'image/png'  => 'png',
        'image/webp' => 'webp', 'image/gif' => 'gif',
        'image/svg+xml' => 'svg',
        'image/x-icon' => 'ico',
        'image/vnd.microsoft.icon' => 'ico',
    ];
    private const ALLOWED_DATA = [
        'text/csv' => 'csv',
        'application/vnd.ms-excel' => 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
        'application/json' => 'json',
        'application/pdf'  => 'pdf',
        'text/plain'       => 'txt',
    ];

    public function upload(): void
    {
        $claims = Auth::requireUser();
        $bucket = (string)($_POST['bucket'] ?? '');

        if (in_array($bucket, self::ADMIN_BUCKETS, true)) {
            if (!in_array('admin', $claims['roles'] ?? [], true)) {
                Response::forbidden('Admin only');
            }
        } elseif (!in_array($bucket, self::PUBLIC_BUCKETS, true)) {
            Response::error('Invalid bucket');
        }

        if (!isset($_FILES['file'])) Response::error('No file');
        $f = $_FILES['file'];
        if ($f['error'] !== UPLOAD_ERR_OK) Response::error('Upload failed: ' . $f['error']);

        $max = (int)($_ENV['UPLOAD_MAX_BYTES'] ?? 10 * 1024 * 1024);
        if ($f['size'] > $max) Response::error("File too large (max " . intdiv($max, 1024 * 1024) . " MB)");

        $mime  = mime_content_type($f['tmp_name']) ?: '';
        $isData = $bucket === 'sample-datasets';
        $allowed = $isData
            ? array_merge(self::ALLOWED_IMAGE, self::ALLOWED_DATA)
            : self::ALLOWED_IMAGE;
        if (!isset($allowed[$mime])) Response::error("Unsupported type: $mime");
        $ext = $allowed[$mime];

        $yyyy = date('Y'); $mm = date('m');
        $name = bin2hex(random_bytes(16)) . '.' . $ext;

        // Prefer /public_html/uploads (served directly by Apache) via UPLOADS_DIR;
        // fall back to /backend-php/uploads
        $baseDir = rtrim($_ENV['UPLOADS_DIR'] ?? (dirname(__DIR__, 2) . '/uploads'), '/');
        $dir = "$baseDir/$bucket/$yyyy/$mm";
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            Response::error('Cannot create upload directory', 500);
        }
        if (!move_uploaded_file($f['tmp_name'], "$dir/$name")) {
            Response::error('Failed to move file', 500);
        }

        // Build public URL. Prefer UPLOADS_PUBLIC_URL (points at /uploads via Apache).
        $publicBase = rtrim($_ENV['UPLOADS_PUBLIC_URL'] ?? (($_ENV['APP_URL'] ?? '') . '/uploads'), '/');
        $url = "$publicBase/$bucket/$yyyy/$mm/$name";

        Response::json([
            'url'    => $url,
            'name'   => $name,
            'bucket' => $bucket,
            'size'   => $f['size'],
            'mime'   => $mime,
        ]);
    }

    /** Fallback serve — only used if uploads dir is not directly public. */
    public function serve(array $p): void
    {
        $bucket = $p['bucket'];
        $rel    = ltrim($p['name'] ?? '', '/');
        if (str_contains($rel, '..')) Response::notFound();

        $baseDir = rtrim($_ENV['UPLOADS_DIR'] ?? (dirname(__DIR__, 2) . '/uploads'), '/');
        $path = "$baseDir/$bucket/$rel";
        if (!is_file($path)) Response::notFound();

        header('Content-Type: ' . (mime_content_type($path) ?: 'application/octet-stream'));
        header('Content-Length: ' . filesize($path));
        header('Cache-Control: public, max-age=31536000, immutable');
        readfile($path);
        exit;
    }
}
