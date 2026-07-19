<?php
namespace Emailsly;

final class Request
{
    public static function json(): array
    {
        $raw = file_get_contents('php://input') ?: '';
        if ($raw === '') return [];
        $d = json_decode($raw, true);
        if (!is_array($d)) Response::error('Invalid JSON body', 400);
        return $d;
    }

    public static function query(string $key, ?string $default = null): ?string
    {
        return $_GET[$key] ?? $default;
    }

    public static function ip(): string
    {
        $remote = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

        // Only trust X-Forwarded-For when the operator has explicitly
        // opted in (front-end proxy / load-balancer). Otherwise the
        // header is client-controlled and would let attackers rotate
        // "IPs" to bypass the rate limiter.
        $trustProxy = ($_ENV['TRUST_PROXY'] ?? getenv('TRUST_PROXY') ?? '0');
        if ((string)$trustProxy !== '1') {
            return $remote;
        }

        $xff = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
        if ($xff === '') return $remote;

        // First entry is the original client; the rest are proxy hops.
        $first = trim(explode(',', $xff)[0]);
        if ($first !== '' && filter_var($first, FILTER_VALIDATE_IP)) {
            return $first;
        }
        return $remote;
    }
}
