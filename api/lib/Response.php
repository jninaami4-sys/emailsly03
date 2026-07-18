<?php
declare(strict_types=1);

final class Response
{
    public static function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function error(string $message, int $status = 400, mixed $extra = null): never
    {
        self::json(['error' => $message, 'extra' => $extra], $status);
    }

    /** @return array<string, mixed> */
    public static function jsonBody(): array
    {
        $raw = file_get_contents('php://input') ?: '';
        if ($raw === '') return [];
        $data = json_decode($raw, true);
        if (!is_array($data)) self::error('Invalid JSON body', 400);
        return $data;
    }
}
