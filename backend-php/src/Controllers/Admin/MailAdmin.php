<?php
namespace Emailsly\Controllers\Admin;

use Emailsly\{Auth, Mailer, Request, Response};

/**
 * Admin utility: send a test email through any configured SMTP channel so
 * the operator can verify credentials + template rendering from cPanel.
 *
 * POST /api/admin/test-email
 *   { "channel": "auth" | "orders" | "support" | "contact" | "all",
 *     "to": "you@example.com",
 *     "subject"?: string,
 *     "message"?: string,
 *     "html"?: bool }
 */
final class MailAdmin
{
    public function testSend(): void
    {
        Auth::requireAdmin();
        $b = Request::json();

        $to = trim((string)($b['to'] ?? ''));
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            Response::json(['error' => 'Valid recipient email required'], 400);
            return;
        }

        $channel = strtolower((string)($b['channel'] ?? 'auth'));
        $channels = $channel === 'all'
            ? ['auth', 'orders', 'support', 'contact']
            : [$channel];

        $subject = (string)($b['subject'] ?? 'Emailsly SMTP test');
        $html    = (bool)($b['html'] ?? true);
        $message = (string)($b['message'] ?? '');

        $results = [];
        foreach ($channels as $ch) {
            $mailer = $this->mailerFor($ch);
            if (!$mailer) {
                $results[] = ['channel' => $ch, 'ok' => false, 'error' => 'Unknown channel'];
                continue;
            }
            $body = $html
                ? $this->htmlTemplate($ch, $mailer->fromEmail, $message)
                : $this->plainTemplate($ch, $mailer->fromEmail, $message);

            $started = microtime(true);
            $ok = $mailer->send($to, "[$ch] $subject", $body, $html);
            $results[] = [
                'channel' => $ch,
                'from'    => $mailer->fromEmail,
                'host'    => $mailer->host . ':' . $mailer->port,
                'ok'      => $ok,
                'ms'      => (int)round((microtime(true) - $started) * 1000),
            ];
        }

        Response::json(['to' => $to, 'results' => $results]);
    }

    private function mailerFor(string $ch): ?Mailer
    {
        return match ($ch) {
            'auth'    => Mailer::auth(),
            'orders'  => Mailer::orders(),
            'support' => Mailer::support(),
            'contact' => Mailer::contact(),
            default   => null,
        };
    }

    private function htmlTemplate(string $ch, string $from, string $extra): string
    {
        $safe = htmlspecialchars($extra, ENT_QUOTES, 'UTF-8');
        $when = date('Y-m-d H:i:s T');
        return <<<HTML
<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f7fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
        <tr><td style="padding:28px 32px 8px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#7c3aed;font-weight:700;">Emailsly · SMTP diagnostic</div>
          <h1 style="margin:8px 0 4px;font-size:22px;color:#0f172a;">Test delivery via <span style="color:#7c3aed;">{$ch}</span> channel</h1>
          <p style="margin:0;color:#475569;font-size:14px;">This message confirms SMTP auth, TLS, and template rendering for the <strong>{$ch}</strong> sender.</p>
        </td></tr>
        <tr><td style="padding:16px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;font-size:13px;color:#334155;">
            <tr><td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;"><strong>Channel</strong></td><td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;">{$ch}</td></tr>
            <tr><td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;"><strong>From</strong></td><td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;">{$from}</td></tr>
            <tr><td style="padding:10px 14px;"><strong>Sent at</strong></td><td style="padding:10px 14px;">{$when}</td></tr>
          </table>
        </td></tr>
        HTML
        . ($safe !== '' ? "<tr><td style=\"padding:16px 32px 0;color:#334155;font-size:14px;line-height:1.55;\">{$safe}</td></tr>" : '')
        . <<<HTML
        <tr><td style="padding:20px 32px 28px;color:#94a3b8;font-size:12px;">
          If you did not request this test, you can safely ignore it.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
HTML;
    }

    private function plainTemplate(string $ch, string $from, string $extra): string
    {
        $when = date('Y-m-d H:i:s T');
        $out  = "Emailsly SMTP diagnostic\n\n";
        $out .= "Channel : $ch\n";
        $out .= "From    : $from\n";
        $out .= "Sent at : $when\n";
        if ($extra !== '') $out .= "\n$extra\n";
        return $out;
    }
}