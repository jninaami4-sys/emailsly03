<?php
declare(strict_types=1);

$body = Response::jsonBody();
$email    = strtolower(trim((string)($body['email'] ?? '')));
$password = (string)($body['password'] ?? '');
$fullName = trim((string)($body['full_name'] ?? ''));
$refCode  = trim((string)($body['referral_code'] ?? ''));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) Response::error('Invalid email', 400);
if (strlen($password) < 8) Response::error('Password must be at least 8 characters', 400);

$existing = Db::one('SELECT id, email_verified FROM users WHERE email = :e', ['e' => $email]);
if ($existing && (int)$existing['email_verified'] === 1) {
    Response::error('Email already registered', 409);
}

$userId = $existing['id'] ?? Db::uuid();
$hash   = password_hash($password, PASSWORD_BCRYPT);

if (!$existing) {
    Db::insert('users', [
        'id' => $userId, 'email' => $email, 'password_hash' => $hash,
        'email_verified' => 0, 'full_name' => $fullName ?: null,
    ]);
    // Default role
    Db::run('INSERT IGNORE INTO user_roles (user_id, role) VALUES (:u, "user")', ['u' => $userId]);

    // Profile shell
    $referrer = null;
    if ($refCode !== '') {
        $r = Db::one('SELECT user_id FROM profiles WHERE referral_code = :c', ['c' => $refCode]);
        if ($r) $referrer = $r['user_id'];
    }
    Db::insert('profiles', [
        'user_id' => $userId, 'email' => $email, 'full_name' => $fullName ?: null,
        'referral_code' => strtoupper(substr(str_replace(['+','/','='], '', base64_encode(random_bytes(6))), 0, 8)),
        'referred_by_user_id' => $referrer,
    ]);
} else {
    // Not verified yet — allow overwriting password
    Db::update('users', ['password_hash' => $hash, 'full_name' => $fullName ?: null], ['id' => $userId]);
}

// Generate + store 6-digit OTP
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
    "<p>Your verification code is:</p><p style=\"font-size:24px;font-weight:700;letter-spacing:6px\">$code</p><p>It expires in 15 minutes. If you didn't request this, ignore this email. Check spam/promotions if you don't see it.</p>",
    null,
    'auth'
);

Response::json(['ok' => true, 'needs_otp' => true, 'email' => $email]);
