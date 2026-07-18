<?php
declare(strict_types=1);

$body = Response::jsonBody();
$email = strtolower(trim((string)($body['email'] ?? '')));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) Response::error('Invalid email', 400);

$user = Db::one('SELECT id, email_verified FROM users WHERE email = :e', ['e' => $email]);
if (!$user) Response::error('Unknown email', 404);
if ((int)$user['email_verified'] === 1) Response::error('Already verified', 400);

// Rate limit: one code per 30s per email
$recent = Db::one(
    'SELECT id FROM email_otps
     WHERE email = :e AND purpose = "signup"
       AND created_at > (UTC_TIMESTAMP() - INTERVAL 30 SECOND)
     ORDER BY id DESC LIMIT 1',
    ['e' => $email]
);
if ($recent) Response::error('Please wait a moment before requesting another code', 429);

$code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
Db::insert('email_otps', [
    'email' => $email,
    'code_hash' => hash('sha256', $code),
    'purpose' => 'signup',
    'expires_at' => gmdate('Y-m-d H:i:s', time() + 15 * 60),
]);
Mail::send(
    $email,
    'Your verification code',
    "<p>Your verification code is:</p><p style=\"font-size:24px;font-weight:700;letter-spacing:6px\">$code</p><p>It expires in 15 minutes. Check spam/promotions if you don't see it.</p>"
);
Response::json(['ok' => true]);
