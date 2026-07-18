<?php
declare(strict_types=1);

$body = Response::jsonBody();
$email    = strtolower(trim((string)($body['email'] ?? '')));
$password = (string)($body['password'] ?? '');
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
    Response::error('Invalid credentials', 400);
}

$user = Db::one('SELECT id, email, password_hash, email_verified, disabled, full_name FROM users WHERE email = :e', ['e' => $email]);
if (!$user || !$user['password_hash'] || !password_verify($password, $user['password_hash'])) {
    Response::error('Invalid credentials', 401);
}
if ((int)$user['disabled'] === 1) Response::error('Account disabled', 403);
if ((int)$user['email_verified'] === 0) {
    Response::error('Email not verified', 403, ['needs_otp' => true, 'email' => $email]);
}

Db::run('UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = :i', ['i' => $user['id']]);
$profile = Db::one('SELECT * FROM profiles WHERE user_id = :u', ['u' => $user['id']]);
$roles = Auth::rolesFor($user['id']);
$token = Auth::issueToken($user, $roles);

Response::json([
    'token'   => $token,
    'user'    => ['id' => $user['id'], 'email' => $user['email'], 'full_name' => $user['full_name'], 'roles' => $roles],
    'profile' => $profile,
]);
