<?php
declare(strict_types=1);

/**
 * Minimal HS256 JWT — no external dependencies.
 * Use only symmetric HS256; do not accept `alg: none` or RS/ES keys.
 */
final class Jwt
{
    /** @param array<string, mixed> $claims */
    public static function sign(array $claims, ?int $ttl = null): string
    {
        $now = time();
        $payload = array_merge([
            'iss' => JWT_ISSUER,
            'iat' => $now,
            'exp' => $now + ($ttl ?? JWT_TTL_SECONDS),
        ], $claims);
        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $seg1 = self::b64(json_encode($header, JSON_UNESCAPED_SLASHES));
        $seg2 = self::b64(json_encode($payload, JSON_UNESCAPED_SLASHES));
        $sig  = hash_hmac('sha256', "$seg1.$seg2", JWT_SECRET, true);
        return "$seg1.$seg2." . self::b64($sig);
    }

    /** @return array<string, mixed> */
    public static function verify(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) throw new RuntimeException('Malformed token');
        [$h, $p, $s] = $parts;
        $header = json_decode(self::b64d($h), true);
        if (!is_array($header) || ($header['alg'] ?? '') !== 'HS256') {
            throw new RuntimeException('Bad alg');
        }
        $expected = hash_hmac('sha256', "$h.$p", JWT_SECRET, true);
        $given = self::b64d($s);
        if (!hash_equals($expected, $given)) throw new RuntimeException('Bad signature');
        $payload = json_decode(self::b64d($p), true);
        if (!is_array($payload)) throw new RuntimeException('Bad payload');
        if (isset($payload['exp']) && time() >= (int)$payload['exp']) {
            throw new RuntimeException('Token expired');
        }
        return $payload;
    }

    private static function b64(string $bin): string
    {
        return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
    }
    private static function b64d(string $s): string
    {
        $pad = 4 - (strlen($s) % 4);
        if ($pad < 4) $s .= str_repeat('=', $pad);
        $bin = base64_decode(strtr($s, '-_', '+/'), true);
        if ($bin === false) throw new RuntimeException('Bad base64');
        return $bin;
    }
}
