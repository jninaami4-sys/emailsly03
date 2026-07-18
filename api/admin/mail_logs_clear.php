<?php
declare(strict_types=1);
Auth::requireAdmin();

$path = __DIR__ . '/../logs/mail.log';
if (is_file($path)) @unlink($path);
Response::json(['ok' => true]);
