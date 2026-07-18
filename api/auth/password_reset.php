<?php
declare(strict_types=1);

$body = Response::jsonBody();
$token    = trim((string)($body['token'] ?? ''));
$password = (string)($body['password'] ?? '');
$email    = strtolower(trim((string)($body['email'] ?? '')));
if (strlen($password) < 8 || $token === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    Response::error('Invalid input', 400);
}

$row = Db::one(
    'SELECT id, email, expires_at, consumed_at FROM password_resets
     WHERE email = :e AND token_hash = :h ORDER BY id DESC LIMIT 1',
    ['e' => $email, 'h' => hash('sha256', $token)]
);
if (!$row) Response::error('Invalid token', 400);
if ($row['consumed_at']) Response::error('Token already used', 400);
if (strtotime($row['expires_at'] . ' UTC') < time()) Response::error('Token expired', 400);

$hash = password_hash($password, PASSWORD_BCRYPT);
Db::update('users', ['password_hash' => $hash], ['email' => $email]);
Db::run('UPDATE password_resets SET consumed_at = UTC_TIMESTAMP() WHERE id = :i', ['i' => $row['id']]);
Response::json(['ok' => true]);
