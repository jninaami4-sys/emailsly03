<?php
declare(strict_types=1);

$c = Auth::require();
$user = Db::one('SELECT id, email, full_name FROM users WHERE id = :i AND disabled = 0', ['i' => $c['user_id']]);
if (!$user) Response::error('Account unavailable', 403);
$roles = Auth::rolesFor($user['id']);
$profile = Db::one('SELECT * FROM profiles WHERE user_id = :u', ['u' => $user['id']]);
Response::json([
    'token'   => Auth::issueToken($user, $roles),
    'user'    => $user + ['roles' => $roles],
    'profile' => $profile,
]);
