<?php
declare(strict_types=1);

$body = Response::jsonBody();
$email = strtolower(trim((string)($body['email'] ?? '')));
$code  = trim((string)($body['code'] ?? ''));
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^\d{6}$/', $code)) {
    Response::error('Invalid email or code', 400);
}

$row = Db::one(
    'SELECT id, code_hash, expires_at, consumed_at, attempts
     FROM email_otps
     WHERE email = :e AND purpose = "signup"
     ORDER BY id DESC LIMIT 1',
    ['e' => $email]
);
if (!$row) Response::error('No pending verification', 404);
if ($row['consumed_at']) Response::error('Code already used', 400);
if (strtotime($row['expires_at'] . ' UTC') < time()) Response::error('Code expired', 400);
if ((int)$row['attempts'] >= 8) Response::error('Too many attempts', 429);

Db::run('UPDATE email_otps SET attempts = attempts + 1 WHERE id = :i', ['i' => $row['id']]);
if (!hash_equals((string)$row['code_hash'], hash('sha256', $code))) {
    Response::error('Incorrect code', 400);
}

Db::run('UPDATE email_otps SET consumed_at = UTC_TIMESTAMP() WHERE id = :i', ['i' => $row['id']]);
Db::run('UPDATE users SET email_verified = 1 WHERE email = :e', ['e' => $email]);

$user = Db::one('SELECT id, email, full_name FROM users WHERE email = :e', ['e' => $email]);
if (!$user) Response::error('User not found', 404);
$profile = Db::one('SELECT * FROM profiles WHERE user_id = :u', ['u' => $user['id']]);
$roles = Auth::rolesFor($user['id']);
$token = Auth::issueToken($user, $roles);

Response::json(['token' => $token, 'user' => $user + ['roles' => $roles], 'profile' => $profile]);
