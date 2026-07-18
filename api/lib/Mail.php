<?php
declare(strict_types=1);

/**
 * Very small SMTP-or-log mailer. If SMTP_HOST is empty, mail is written to
 * api/logs/mail.log — handy for local dev and for shared hosts where you
 * haven't configured SMTP yet.
 */
final class Mail
{
    /**
     * Send an email. $kind selects the From address:
     *   'auth'   -> SMTP_FROM_AUTH   (OTP codes, verification links, password resets)
     *   'orders' -> SMTP_FROM_ORDERS (order confirmation, invoice, status updates)
     *   default  -> SMTP_FROM        (fallback / generic)
     */
    public static function send(string $to, string $subject, string $html, ?string $text = null, string $kind = 'auth'): void
    {
        if (defined('SMTP_HOST') && SMTP_HOST) {
            self::sendSmtp($to, $subject, $html, $text, $kind);
        } else {
            self::log($to, $subject, $html);
        }
    }

    private static function resolveFrom(string $kind): string
    {
        if ($kind === 'auth' && defined('SMTP_FROM_AUTH') && SMTP_FROM_AUTH) return SMTP_FROM_AUTH;
        if ($kind === 'orders' && defined('SMTP_FROM_ORDERS') && SMTP_FROM_ORDERS) return SMTP_FROM_ORDERS;
        return SMTP_FROM;
    }


    private static function log(string $to, string $subject, string $html): void
    {
        $dir = __DIR__ . '/../logs';
        if (!is_dir($dir)) @mkdir($dir, 0775, true);
        file_put_contents(
            $dir . '/mail.log',
            "[" . date('c') . "] TO $to :: $subject\n$html\n\n---\n",
            FILE_APPEND
        );
    }

    private static function sendSmtp(string $to, string $subject, string $html, ?string $text): void
    {
        $secure = defined('SMTP_SECURE') ? SMTP_SECURE : '';
        $host = ($secure === 'ssl') ? 'ssl://' . SMTP_HOST : SMTP_HOST;
        $fp = @stream_socket_client("$host:" . SMTP_PORT, $errno, $errstr, 15);
        if (!$fp) throw new RuntimeException("SMTP connect failed: $errstr");
        stream_set_timeout($fp, 15);
        $read = function () use ($fp): string {
            $s = '';
            while (($line = fgets($fp, 1024)) !== false) {
                $s .= $line;
                if (isset($line[3]) && $line[3] === ' ') break;
            }
            return $s;
        };
        $cmd = function (string $c) use ($fp, $read): string {
            fwrite($fp, $c . "\r\n");
            return $read();
        };
        $read();
        $cmd('EHLO ' . (parse_url(PUBLIC_URL, PHP_URL_HOST) ?: 'localhost'));
        if ($secure === 'tls') {
            $cmd('STARTTLS');
            stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            $cmd('EHLO ' . (parse_url(PUBLIC_URL, PHP_URL_HOST) ?: 'localhost'));
        }
        if (defined('SMTP_USER') && SMTP_USER) {
            $cmd('AUTH LOGIN');
            $cmd(base64_encode(SMTP_USER));
            $cmd(base64_encode(SMTP_PASS));
        }
        $from = SMTP_FROM;
        $fromName = defined('SMTP_FROM_NAME') ? SMTP_FROM_NAME : $from;
        $cmd("MAIL FROM: <$from>");
        $cmd("RCPT TO: <$to>");
        $cmd('DATA');
        $boundary = 'b_' . bin2hex(random_bytes(8));
        $headers  = "From: $fromName <$from>\r\n";
        $headers .= "To: $to\r\n";
        $headers .= "Subject: $subject\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
        $body  = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n" . ($text ?? strip_tags($html)) . "\r\n";
        $body .= "--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n$html\r\n";
        $body .= "--$boundary--\r\n.\r\n";
        fwrite($fp, $headers . "\r\n" . $body);
        $read();
        $cmd('QUIT');
        fclose($fp);
    }
}
