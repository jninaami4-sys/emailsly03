<?php
namespace Emailsly;

/**
 * Tiny SMTP client for cPanel-hosted mailboxes. Supports two logical
 * channels wired to different authenticated senders:
 *
 *   Mailer::auth()   -> no-reply@mail.emailsly.com  (password reset, verify)
 *   Mailer::orders() -> orders@mail.emailsly.com    (order confirmations)
 *
 * Uses STARTTLS on 587 by default, or implicit TLS on 465 when
 * SMTP_SECURE=ssl. No external dependencies — plain fsockopen.
 */
final class Mailer
{
    public string $host;
    public int $port;
    public string $secure; // tls | ssl | none
    public string $user;
    public string $pass;
    public string $fromEmail;
    public string $fromName;

    private function __construct(array $c)
    {
        $this->host      = $c['host'];
        $this->port      = (int)$c['port'];
        $this->secure    = strtolower($c['secure'] ?? 'tls');
        $this->user      = $c['user'];
        $this->pass      = $c['pass'];
        $this->fromEmail = $c['from'];
        $this->fromName  = $c['name'] ?? '';
    }

    public static function auth(): self
    {
        return new self([
            'host'   => $_ENV['SMTP_HOST'] ?? 'localhost',
            'port'   => $_ENV['SMTP_PORT'] ?? 587,
            'secure' => $_ENV['SMTP_SECURE'] ?? 'tls',
            'user'   => $_ENV['SMTP_AUTH_USER'] ?? 'no-reply@mail.emailsly.com',
            'pass'   => $_ENV['SMTP_AUTH_PASS'] ?? '',
            'from'   => $_ENV['SMTP_AUTH_FROM'] ?? 'no-reply@mail.emailsly.com',
            'name'   => $_ENV['SMTP_AUTH_FROM_NAME'] ?? 'Emailsly Security',
        ]);
    }

    public static function orders(): self
    {
        return new self([
            'host'   => $_ENV['SMTP_HOST'] ?? 'localhost',
            'port'   => $_ENV['SMTP_PORT'] ?? 587,
            'secure' => $_ENV['SMTP_SECURE'] ?? 'tls',
            'user'   => $_ENV['SMTP_ORDERS_USER'] ?? 'orders@mail.emailsly.com',
            'pass'   => $_ENV['SMTP_ORDERS_PASS'] ?? '',
            'from'   => $_ENV['SMTP_ORDERS_FROM'] ?? 'orders@mail.emailsly.com',
            'name'   => $_ENV['SMTP_ORDERS_FROM_NAME'] ?? 'Emailsly Orders',
        ]);
    }

    public static function support(): self
    {
        return new self([
            'host'   => $_ENV['SMTP_HOST'] ?? 'localhost',
            'port'   => $_ENV['SMTP_PORT'] ?? 587,
            'secure' => $_ENV['SMTP_SECURE'] ?? 'tls',
            'user'   => $_ENV['SMTP_SUPPORT_USER'] ?? 'support@mail.emailsly.com',
            'pass'   => $_ENV['SMTP_SUPPORT_PASS'] ?? '',
            'from'   => $_ENV['SMTP_SUPPORT_FROM'] ?? 'support@mail.emailsly.com',
            'name'   => $_ENV['SMTP_SUPPORT_FROM_NAME'] ?? 'Emailsly Support',
        ]);
    }

    public static function contact(): self
    {
        return new self([
            'host'   => $_ENV['SMTP_HOST'] ?? 'localhost',
            'port'   => $_ENV['SMTP_PORT'] ?? 587,
            'secure' => $_ENV['SMTP_SECURE'] ?? 'tls',
            'user'   => $_ENV['SMTP_CONTACT_USER'] ?? 'hello@emailsly.com',
            'pass'   => $_ENV['SMTP_CONTACT_PASS'] ?? '',
            'from'   => $_ENV['SMTP_CONTACT_FROM'] ?? 'hello@emailsly.com',
            'name'   => $_ENV['SMTP_CONTACT_FROM_NAME'] ?? 'Emailsly',
        ]);
    }

    /** Send one message. Returns true on success. Never throws to callers. */
    public function send(string $to, string $subject, string $body, bool $html = false, ?string $replyTo = null): bool
    {
        try {
            $this->deliver([$to], $subject, $body, $html, $replyTo);
            return true;
        } catch (\Throwable $e) {
            error_log('[Mailer] ' . $e->getMessage());
            return false;
        }
    }

    private function deliver(array $recipients, string $subject, string $body, bool $html, ?string $replyTo): void
    {
        $transport = $this->secure === 'ssl' ? 'ssl://' : '';
        $errno = 0; $errstr = '';
        $sock = @stream_socket_client($transport . $this->host . ':' . $this->port, $errno, $errstr, 15);
        if (!$sock) throw new \RuntimeException("SMTP connect failed: $errstr ($errno)");
        stream_set_timeout($sock, 15);
        $this->expect($sock, 220);

        $ehlo = 'emailsly.local';
        $this->cmd($sock, "EHLO $ehlo", 250);

        if ($this->secure === 'tls') {
            $this->cmd($sock, 'STARTTLS', 220);
            if (!@stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT)) {
                throw new \RuntimeException('STARTTLS negotiation failed');
            }
            $this->cmd($sock, "EHLO $ehlo", 250);
        }

        if ($this->user !== '' && $this->pass !== '') {
            $this->cmd($sock, 'AUTH LOGIN', 334);
            $this->cmd($sock, base64_encode($this->user), 334);
            $this->cmd($sock, base64_encode($this->pass), 235);
        }

        $this->cmd($sock, 'MAIL FROM:<' . $this->fromEmail . '>', 250);
        foreach ($recipients as $rcpt) {
            $this->cmd($sock, 'RCPT TO:<' . $rcpt . '>', [250, 251]);
        }
        $this->cmd($sock, 'DATA', 354);

        $fromHeader = $this->fromName !== ''
            ? sprintf('"%s" <%s>', addslashes($this->fromName), $this->fromEmail)
            : $this->fromEmail;
        $headers = [
            'From: ' . $fromHeader,
            'To: ' . implode(', ', $recipients),
            'Subject: ' . $this->encodeHeader($subject),
            'Date: ' . date('r'),
            'MIME-Version: 1.0',
            'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . $this->host . '>',
            'Content-Type: ' . ($html ? 'text/html' : 'text/plain') . '; charset=utf-8',
            'Content-Transfer-Encoding: 8bit',
        ];
        if ($replyTo) $headers[] = 'Reply-To: ' . $replyTo;

        $data = implode("\r\n", $headers) . "\r\n\r\n"
              . preg_replace('/^\./m', '..', str_replace(["\r\n", "\r", "\n"], "\r\n", $body))
              . "\r\n.";
        $this->cmd($sock, $data, 250);
        $this->cmd($sock, 'QUIT', [221, 250]);
        fclose($sock);
    }

    private function cmd($sock, string $line, int|array $expect): string
    {
        fwrite($sock, $line . "\r\n");
        return $this->expect($sock, $expect);
    }

    private function expect($sock, int|array $expect): string
    {
        $codes = (array)$expect;
        $buf = '';
        while (($line = fgets($sock, 1024)) !== false) {
            $buf .= $line;
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        $code = (int)substr(ltrim($buf), 0, 3);
        if (!in_array($code, $codes, true)) {
            throw new \RuntimeException('SMTP unexpected ' . $code . ': ' . trim($buf));
        }
        return $buf;
    }

    private function encodeHeader(string $s): string
    {
        return preg_match('/[^\x20-\x7e]/', $s)
            ? '=?UTF-8?B?' . base64_encode($s) . '?='
            : $s;
    }
}