<?php
declare(strict_types=1);
// Simple time-limited signed URL. Signature = HMAC(JWT_SECRET, bucket|path|exp)
$body = Response::jsonBody();
$bucket = (string)($body['bucket'] ?? '');
$path   = (string)($body['path'] ?? '');
$ttl    = (int)($body['expires_in'] ?? 3600);
if ($bucket === '' || $path === '') Response::error('Missing bucket/path', 400);
Auth::require();
$exp = time() + max(60, min($ttl, 60 * 60 * 24));
$sig = hash_hmac('sha256', "$bucket|$path|$exp", JWT_SECRET);
$url = rtrim(PUBLIC_URL, '/') . '/api/uploads/download?bucket=' . rawurlencode($bucket)
     . '&path=' . rawurlencode($path) . '&exp=' . $exp . '&sig=' . $sig;
Response::json(['url' => $url, 'expires_at' => gmdate('c', $exp)]);
