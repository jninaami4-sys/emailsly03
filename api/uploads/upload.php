<?php
declare(strict_types=1);

// Bucket policy: which buckets require admin write?
$adminOnly = ['brand-assets', 'announcement-media', 'sample-datasets'];
$publicBuckets = ['brand-assets', 'avatars', 'reviews', 'announcement-media'];
$allowed = array_merge($publicBuckets, ['sample-datasets']);

$bucket = strtolower(trim((string)($_POST['bucket'] ?? '')));
if (!in_array($bucket, $allowed, true)) Response::error('Unknown bucket', 400);

$c = Auth::require();
if (in_array($bucket, $adminOnly, true) && !in_array('admin', $c['roles'], true)) {
    Response::error('Forbidden', 403);
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    Response::error('File missing or upload error', 400);
}
$file = $_FILES['file'];
if ($file['size'] > 20 * 1024 * 1024) Response::error('File too large (max 20MB)', 413);

$destPath = trim((string)($_POST['path'] ?? ''), '/');
if ($destPath === '') {
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $ext = preg_replace('/[^a-zA-Z0-9]/', '', (string)$ext);
    $destPath = date('Y/m/') . bin2hex(random_bytes(8)) . ($ext ? ".$ext" : '');
}
// prevent traversal
if (str_contains($destPath, '..')) Response::error('Bad path', 400);

$fullDir  = rtrim(UPLOAD_DIR, '/') . "/$bucket/" . dirname($destPath);
$fullPath = rtrim(UPLOAD_DIR, '/') . "/$bucket/$destPath";
if (!is_dir($fullDir)) @mkdir($fullDir, 0775, true);
if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
    Response::error('Failed to store file', 500);
}

$publicUrl = in_array($bucket, $publicBuckets, true)
    ? rtrim(PUBLIC_URL, '/') . "/api/uploads/public/" . rawurlencode($bucket) . '/' . implode('/', array_map('rawurlencode', explode('/', $destPath)))
    : rtrim(PUBLIC_URL, '/') . "/api/uploads/sign?bucket=$bucket&path=" . rawurlencode($destPath);

Response::json(['url' => $publicUrl, 'path' => $destPath, 'bucket' => $bucket]);
