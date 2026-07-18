<?php
declare(strict_types=1);
Auth::requireAdmin();

$body = Response::jsonBody();
$to      = trim((string)($body['to'] ?? ''));
$channel = (string)($body['channel'] ?? 'all');
$subject = trim((string)($body['subject'] ?? 'Emailsly SMTP test')) ?: 'Emailsly SMTP test';
$message = (string)($body['message'] ?? 'This is a test email from the Emailsly admin panel.');
$asHtml  = (bool)($body['html'] ?? true);

if (!filter_var($to, FILTER_VALIDATE_EMAIL)) Response::error('Valid recipient email required', 422);

$allChannels = ['auth','orders','support','contact'];
$targets = $channel === 'all' ? $allChannels : [$channel];
foreach ($targets as $t) if (!in_array($t, $allChannels, true)) Response::error("Unknown channel: $t", 422);

$brand = defined('SMTP_FROM_NAME') ? SMTP_FROM_NAME : 'Emailsly';
$host  = Mail::smtpHost() ?: '(log mode)';

$sampleOtp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$sampleOrder = 'TEST-' . strtoupper(bin2hex(random_bytes(3)));

$templates = [
    'auth' => [
        'subject' => "[TEST] Your $brand verification code: $sampleOtp",
        'html' => "<div style=\"font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px\"><h2 style=\"margin:0 0 8px\">Verify your email</h2><p style=\"color:#555\">This is a <b>test OTP</b> email from the $brand admin panel.</p><div style=\"font-size:32px;font-weight:800;letter-spacing:8px;background:#f6f6f6;padding:16px;border-radius:8px;text-align:center;margin:16px 0\">$sampleOtp</div><p style=\"color:#777;font-size:12px\">If you didn't request this, ignore it. Check your spam/junk folder if a real code doesn't arrive.</p><hr><p style=\"color:#999;font-size:11px\">$message</p></div>",
    ],
    'orders' => [
        'subject' => "[TEST] Order $sampleOrder confirmed · $brand",
        'html' => "<div style=\"font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px\"><h2 style=\"margin:0 0 8px\">Thanks for your order!</h2><p style=\"color:#555\">This is a <b>test order confirmation</b> email from $brand.</p><table style=\"width:100%;border-collapse:collapse;margin:16px 0\"><tr><td style=\"padding:8px;border-bottom:1px solid #eee\">Order #</td><td style=\"padding:8px;border-bottom:1px solid #eee;text-align:right\"><b>$sampleOrder</b></td></tr><tr><td style=\"padding:8px;border-bottom:1px solid #eee\">Item</td><td style=\"padding:8px;border-bottom:1px solid #eee;text-align:right\">Sample Service × 1</td></tr><tr><td style=\"padding:8px\">Total</td><td style=\"padding:8px;text-align:right\"><b>\$100.00</b></td></tr></table><p style=\"color:#777;font-size:12px\">We'll email delivery details shortly.</p><hr><p style=\"color:#999;font-size:11px\">$message</p></div>",
    ],
    'support' => [
        'subject' => "[TEST] Support ticket receipt · $brand",
        'html' => "<div style=\"font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:24px\"><h2>Support test</h2><p>This is a test support email.</p><p style=\"color:#999;font-size:11px\">$message</p></div>",
    ],
    'contact' => [
        'subject' => "[TEST] Contact form auto-reply · $brand",
        'html' => "<div style=\"font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:24px\"><h2>Contact test</h2><p>This is a test contact auto-reply.</p><p style=\"color:#999;font-size:11px\">$message</p></div>",
    ],
];

$results = [];
foreach ($targets as $t) {
    $tpl = $templates[$t];
    $subj = ($channel === 'all' || !$body['subject']) ? $tpl['subject'] : $subject;
    $html = $asHtml ? $tpl['html'] : nl2br(htmlspecialchars($message));
    $from = Mail::resolveFrom($t);
    $start = microtime(true);
    try {
        Mail::send($to, $subj, $html, null, $t);
        $results[] = ['channel'=>$t,'from'=>$from,'host'=>$host,'ok'=>true,'ms'=>(int)round((microtime(true)-$start)*1000)];
    } catch (Throwable $e) {
        $results[] = ['channel'=>$t,'from'=>$from,'host'=>$host,'ok'=>false,'ms'=>(int)round((microtime(true)-$start)*1000),'error'=>$e->getMessage()];
    }
}

Response::json(['to'=>$to,'results'=>$results]);
