<?php
namespace Emailsly\Controllers;

use Emailsly\{Auth, Database, Mailer, RateLimit, Request, Response};

final class AuthController
{
    public function register(): void
    {
        RateLimit::check('auth_register', 10, 3600);
        $b = Request::json();
        $email = strtolower(trim($b['email'] ?? ''));
        $password = (string)($b['password'] ?? '');
        $fullName = trim($b['full_name'] ?? '');
        $referredBy = $b['referral_code'] ?? null;

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) Response::error('Invalid email');
        if (strlen($password) < 8) Response::error('Password must be 8+ characters');

        $pdo = Database::pdo();
        $exists = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $exists->execute([$email]);
        if ($exists->fetch()) Response::error('Email already registered', 409);

        $userId = Database::uuid();
        $pdo->beginTransaction();
        try {
            $pdo->prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)')
                ->execute([$userId, $email, Auth::hash($password)]);

            $referrerId = null;
            if ($referredBy) {
                $s = $pdo->prepare('SELECT user_id FROM profiles WHERE referral_code = ?');
                $s->execute([$referredBy]);
                $referrerId = $s->fetchColumn() ?: null;
            }
            $pdo->prepare('INSERT INTO profiles (user_id, email, full_name, referral_code, referred_by_user_id) VALUES (?, ?, ?, ?, ?)')
                ->execute([$userId, $email, $fullName ?: null, self::genReferralCode($pdo), $referrerId]);

            $pdo->prepare('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, "user")')
                ->execute([Database::uuid(), $userId]);

            if ($referrerId) {
                $pdo->prepare('INSERT IGNORE INTO referrals (id, referrer_id, referred_user_id, status) VALUES (?, ?, ?, "pending")')
                    ->execute([Database::uuid(), $referrerId, $userId]);
            }
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        Response::json(self::sessionPayload($userId));
    }

    public function login(): void
    {
        $b = Request::json();
        $email = strtolower(trim($b['email'] ?? ''));
        $password = (string)($b['password'] ?? '');

        $pdo = Database::pdo();
        $s = $pdo->prepare('SELECT id, password_hash FROM users WHERE email = ?');
        $s->execute([$email]);
        $u = $s->fetch();
        if (!$u || !Auth::verify($password, $u['password_hash'])) {
            Response::error('Invalid email or password', 401);
        }
        $pdo->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?')->execute([$u['id']]);
        Response::json(self::sessionPayload($u['id']));
    }

    public function logout(): void
    {
        // JWT is stateless — client just drops the token.
        Response::json(['ok' => true]);
    }

    public function refresh(): void
    {
        $c = Auth::requireUser();
        Response::json(self::sessionPayload($c['sub']));
    }

    public function me(): void
    {
        $c = Auth::requireUser();
        Response::json(self::userSnapshot($c['sub']));
    }

    public function updateMe(): void
    {
        $c = Auth::requireUser();
        $b = Request::json();
        $pdo = Database::pdo();
        $fields = [];
        $vals = [];
        foreach (['full_name','avatar_url','company','phone','bio'] as $k) {
            if (array_key_exists($k, $b)) { $fields[] = "$k = ?"; $vals[] = $b[$k]; }
        }
        if ($fields) {
            $vals[] = $c['sub'];
            $pdo->prepare('UPDATE profiles SET ' . implode(',', $fields) . ' WHERE user_id = ?')
                ->execute($vals);
        }
        Response::json(self::userSnapshot($c['sub']));
    }

    public function forgotPassword(): void
    {
        $b = Request::json();
        $email = strtolower(trim($b['email'] ?? ''));
        $pdo = Database::pdo();
        $s = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $s->execute([$email]);
        $uid = $s->fetchColumn();
        if ($uid) {
            $token = bin2hex(random_bytes(32));
            $pdo->prepare('INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))')
                ->execute([$token, $uid]);
            $resetUrl = ($_ENV['APP_URL'] ?? '') . '/reset-password?token=' . $token;
            Mailer::auth()->send(
                $email,
                'Reset your Emailsly password',
                "Hi,\n\nClick the link below to reset your Emailsly password:\n\n$resetUrl\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.\n\n— Emailsly Security"
            );
        }
        // Always return ok to prevent user enumeration
        Response::json(['ok' => true]);
    }

    public function resetPassword(): void
    {
        $b = Request::json();
        $token = (string)($b['token'] ?? '');
        $password = (string)($b['password'] ?? '');
        if (strlen($password) < 8) Response::error('Password must be 8+ characters');
        $pdo = Database::pdo();
        $s = $pdo->prepare('SELECT user_id FROM password_resets WHERE token = ? AND expires_at > NOW()');
        $s->execute([$token]);
        $uid = $s->fetchColumn();
        if (!$uid) Response::error('Invalid or expired token', 400);
        $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
            ->execute([Auth::hash($password), $uid]);
        $pdo->prepare('DELETE FROM password_resets WHERE user_id = ?')->execute([$uid]);
        Response::json(self::sessionPayload($uid));
    }

    // ---- helpers ----
    private static function genReferralCode(\PDO $pdo): string
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        for ($i = 0; $i < 12; $i++) {
            $code = '';
            for ($j = 0; $j < 8; $j++) $code .= $chars[random_int(0, strlen($chars) - 1)];
            $s = $pdo->prepare('SELECT 1 FROM profiles WHERE referral_code = ?');
            $s->execute([$code]);
            if (!$s->fetchColumn()) return $code;
        }
        return substr(md5(uniqid('', true)), 0, 8);
    }

    private static function sessionPayload(string $userId): array
    {
        $snap = self::userSnapshot($userId);
        $token = Auth::issue([
            'sub'   => $userId,
            'email' => $snap['user']['email'],
            'roles' => $snap['user']['roles'],
        ], (int)($_ENV['JWT_TTL_DAYS'] ?? 7));
        return ['token' => $token, 'user' => $snap['user'], 'profile' => $snap['profile']];
    }

    private static function userSnapshot(string $userId): array
    {
        $pdo = Database::pdo();
        $u = $pdo->prepare('SELECT id, email, created_at, last_login_at FROM users WHERE id = ?');
        $u->execute([$userId]);
        $user = $u->fetch();
        if (!$user) Response::notFound('User');
        $p = $pdo->prepare('SELECT user_id, full_name, avatar_url, company, phone, bio, referral_code FROM profiles WHERE user_id = ?');
        $p->execute([$userId]);
        $profile = $p->fetch() ?: null;
        $r = $pdo->prepare('SELECT role FROM user_roles WHERE user_id = ?');
        $r->execute([$userId]);
        $user['roles'] = array_column($r->fetchAll(), 'role');
        return ['user' => $user, 'profile' => $profile];
    }

    // Mail delivery is handled by Emailsly\Mailer (SMTP, per-channel sender).
}
