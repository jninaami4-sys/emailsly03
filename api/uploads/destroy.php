<?php
declare(strict_types=1);
Auth::requireAdmin();
$bucket = (string)($_GET['bucket'] ?? '');
$path   = (string)($_GET['path'] ?? '');
if ($bucket === '' || $path === '' || str_contains($path, '..')) Response::error('Bad request', 400);
$full = rtrim(UPLOAD_DIR, '/') . "/$bucket/$path";
if (is_file($full)) @unlink($full);
Response::json(['ok' => true]);
