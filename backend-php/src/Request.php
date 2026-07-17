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
        return $_SERVER['HTTP_X_FORWARDED_FOR']
            ?? $_SERVER['REMOTE_ADDR']
            ?? '0.0.0.0';
    }
}
