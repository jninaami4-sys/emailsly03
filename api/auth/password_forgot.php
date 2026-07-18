<?php
declare(strict_types=1);

$body = Response::jsonBody();
$email = strtolower(trim((string)($body['email'] ?? '')));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) Response::error('Invalid email', 400);

$user = Db::one('SELECT id FROM users WHERE email = :e', ['e' => $email]);
// Always respond OK to avoid enumeration; only send mail if user exists.
if ($user) {
    $tokenRaw = bin2hex(random_bytes(24));
    Db::insert('password_resets', [
        'email' => $email,
        'token_hash' => hash('sha256', $tokenRaw),
        'expires_at' => gmdate('Y-m-d H:i:s', time() + 60 * 60),
    ]);
    $link = rtrim(FRONTEND_URL, '/') . '/reset-password?token=' . $tokenRaw . '&email=' . urlencode($email);
    Mail::send($email, 'Reset your password',
        "<p>Click the link below to reset your password (valid for 60 minutes):</p><p><a href=\"$link\">$link</a></p>",
        null,
        'auth'
    );
}
Response::json(['ok' => true]);
