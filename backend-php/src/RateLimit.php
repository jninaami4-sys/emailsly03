<?php
namespace Emailsly;

/**
 * Shared-hosting friendly MySQL rate limiter.
 * Fixed-window counters keyed by (bucket, ip, action, window_start).
 * Fail-open on DB errors so a broken limiter never brings down an endpoint.
 */
final class RateLimit
{
    /** Throws 429 if the caller is over budget. */
    public static function check(string $action, int $max, int $windowSec, ?string $bucket = null): void
    {
        try {
            $pdo = Database::pdo();
            $ip  = Request::ip();
            $b   = $bucket ?? 'default';
            $now = time();
            $window = intdiv($now, $windowSec) * $windowSec;

            // Best-effort purge of stale rows (keep 24h of history for observability).
            try {
                $pdo->prepare('DELETE FROM rate_limits WHERE window_start < ?')
                    ->execute([$now - 86400]);
            } catch (\Throwable) { /* ignore */ }

            $pdo->prepare(
                'INSERT INTO rate_limits (bucket, ip, action, window_start, count)
                 VALUES (?,?,?,?,1)
                 ON DUPLICATE KEY UPDATE count = count + 1'
            )->execute([$b, $ip, $action, $window]);

            $s = $pdo->prepare(
                'SELECT count FROM rate_limits
                 WHERE bucket=? AND ip=? AND action=? AND window_start=?'
            );
            $s->execute([$b, $ip, $action, $window]);
            $count = (int)$s->fetchColumn();

            if ($count > $max) {
                $retry = ($window + $windowSec) - $now;
                http_response_code(429);
                header('Content-Type: application/json; charset=utf-8');
                header('Retry-After: ' . max(1, $retry));
                echo json_encode([
                    'error'       => 'Too many requests. Please slow down.',
                    'retry_after' => max(1, $retry),
                ]);
                exit;
            }
        } catch (\Throwable) {
            // Fail open. Rate limiting must never wedge the API.
        }
    }
}
