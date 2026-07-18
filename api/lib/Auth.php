<?php
declare(strict_types=1);

final class Auth
{
    /** @return array{user_id:string,email:string,roles:string[]} */
    public static function require(): array
    {
        $claims = self::currentClaims();
        if ($claims === null) Response::error('Unauthorized', 401);
        return $claims;
    }

    public static function requireAdmin(): array
    {
        $c = self::require();
        if (!in_array('admin', $c['roles'], true)) Response::error('Forbidden', 403);
        return $c;
    }

    /** @return array{user_id:string,email:string,roles:string[]}|null */
    public static function currentClaims(): ?array
    {
        $auth = self::header('Authorization');
        if (!$auth || !preg_match('/Bearer\s+(.+)/i', $auth, $m)) return null;
        try {
            $payload = Jwt::verify(trim($m[1]));
        } catch (\Throwable $e) {
            return null;
        }
        return [
            'user_id' => (string)($payload['sub'] ?? ''),
            'email'   => (string)($payload['email'] ?? ''),
            'roles'   => array_values(array_map('strval', (array)($payload['roles'] ?? []))),
        ];
    }

    /** @param array<string,mixed> $user @param string[] $roles */
    public static function issueToken(array $user, array $roles): string
    {
        return Jwt::sign([
            'sub'   => (string)$user['id'],
            'email' => (string)$user['email'],
            'roles' => array_values($roles),
        ]);
    }

    /** @return string[] */
    public static function rolesFor(string $userId): array
    {
        $rows = Db::all('SELECT role FROM user_roles WHERE user_id = :u', ['u' => $userId]);
        return array_map(fn($r) => (string)$r['role'], $rows);
    }

    public static function header(string $name): ?string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        if (isset($_SERVER[$key])) return $_SERVER[$key];
        // Apache with mod_php sometimes strips Authorization
        if (function_exists('apache_request_headers')) {
            foreach (apache_request_headers() as $k => $v) {
                if (strcasecmp($k, $name) === 0) return $v;
            }
        }
        return null;
    }
}
