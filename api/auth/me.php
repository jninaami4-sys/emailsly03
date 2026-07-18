<?php
declare(strict_types=1);

$c = Auth::require();
$user = Db::one('SELECT id, email, full_name, email_verified, disabled, avatar_url, created_at, last_login_at FROM users WHERE id = :i', ['i' => $c['user_id']]);
if (!$user) Response::error('User not found', 404);
$profile = Db::one('SELECT * FROM profiles WHERE user_id = :u', ['u' => $c['user_id']]);
Response::json(['user' => $user + ['roles' => $c['roles']], 'profile' => $profile]);
