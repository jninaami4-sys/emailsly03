<?php
namespace Emailsly;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

final class Auth
{
    public static function hash(string $password): string
    {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    public static function verify(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    public static function issue(array $claims, int $ttlDays = 7): string
    {
        $now = time();
        $payload = array_merge([
            'iat' => $now,
            'nbf' => $now,
            'exp' => $now + $ttlDays * 86400,
            'iss' => $_ENV['API_URL'] ?? 'emailsly',
        ], $claims);
        return JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');
    }

    public static function decode(string $jwt): ?array
    {
        try {
            $d = JWT::decode($jwt, new Key($_ENV['JWT_SECRET'], 'HS256'));
            return json_decode(json_encode($d), true);
        } catch (\Throwable) {
            return null;
        }
    }

    /** Reads Authorization: Bearer <jwt> and returns claims, or null. */
    public static function currentClaims(): ?array
    {
        $h = $_SERVER['HTTP_AUTHORIZATION']
            ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
        if (!preg_match('/^Bearer\s+(.+)$/i', $h, $m)) return null;
        return self::decode(trim($m[1]));
    }

    public static function requireUser(): array
    {
        $c = self::currentClaims();
        if (!$c || empty($c['sub'])) Response::unauthorized();
        return $c;
    }

    public static function requireAdmin(): array
    {
        $c = self::requireUser();
        $roles = $c['roles'] ?? [];
        if (!in_array('admin', $roles, true)) Response::forbidden('Admin only');
        return $c;
    }

    public static function optionalClaims(): ?array
    {
        return self::currentClaims();
    }
}
