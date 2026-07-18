<?php
declare(strict_types=1);

$c = Auth::require();
$body = Response::jsonBody();

$userFields = ['full_name', 'avatar_url'];
$profileFields = ['full_name', 'company', 'phone', 'country', 'avatar_url', 'bio'];

$uPatch = [];
foreach ($userFields as $f) if (array_key_exists($f, $body)) $uPatch[$f] = $body[$f];
if ($uPatch) Db::update('users', $uPatch, ['id' => $c['user_id']]);

$pPatch = [];
foreach ($profileFields as $f) if (array_key_exists($f, $body)) $pPatch[$f] = $body[$f];
if ($pPatch) Db::update('profiles', $pPatch, ['user_id' => $c['user_id']]);

$user = Db::one('SELECT id, email, full_name, avatar_url FROM users WHERE id = :i', ['i' => $c['user_id']]);
$profile = Db::one('SELECT * FROM profiles WHERE user_id = :u', ['u' => $c['user_id']]);
Response::json(['user' => $user + ['roles' => $c['roles']], 'profile' => $profile]);
