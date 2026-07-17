<?php
namespace Emailsly;

final class Response
{
    public static function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function error(string $message, int $status = 400, array $extra = []): never
    {
        self::json(['error' => $message] + $extra, $status);
    }

    public static function notFound(string $msg = 'Not found'): never { self::error($msg, 404); }
    public static function unauthorized(string $msg = 'Unauthorized'): never { self::error($msg, 401); }
    public static function forbidden(string $msg = 'Forbidden'): never { self::error($msg, 403); }
}
