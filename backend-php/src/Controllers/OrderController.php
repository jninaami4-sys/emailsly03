<?php
namespace Emailsly\Controllers;

use Emailsly\{Auth, Database, Mailer, Request, Response};

final class OrderController
{
    public function listMine(): void
    {
        $c = Auth::requireUser();
        $s = Database::pdo()->prepare(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 200'
        );
        $s->execute([$c['sub']]);
        Response::json(['orders' => $s->fetchAll()]);
    }

    public function create(): void
    {
        $c = Auth::requireUser();
        $b = Request::json();
        $id = Database::uuid();
        $qty = max(1, (int)($b['quantity'] ?? 1));
        $unit = max(0, (int)($b['unit_cents'] ?? 0));
        $sub = $qty * $unit;
        $disc = max(0, (int)($b['discount_cents'] ?? 0));
        $total = max(0, $sub - $disc);
        $customerEmail = $b['customer_email'] ?? $c['email'] ?? null;
        $customerName  = $b['customer_name'] ?? null;
        $service       = $b['service'] ?? null;
        $currency      = $b['currency'] ?? 'USD';
        Database::pdo()->prepare(
            'INSERT INTO orders (id,user_id,service,service_id,quantity,unit_cents,subtotal_cents,discount_cents,total_cents,currency,customer_email,customer_name,notes,metadata,status,payment_status)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, "pending","unpaid")'
        )->execute([
            $id, $c['sub'], $service, $b['service_id'] ?? null,
            $qty, $unit, $sub, $disc, $total,
            $currency,
            $customerEmail,
            $customerName,
            $b['notes'] ?? null,
            isset($b['metadata']) ? json_encode($b['metadata']) : null,
        ]);
        $this->logEvent($id, $c['sub'], 'created', 'Order placed');
        $this->sendOrderConfirmation([
            'id' => $id,
            'service' => $service,
            'quantity' => $qty,
            'total_cents' => $total,
            'currency' => $currency,
            'customer_email' => $customerEmail,
            'customer_name' => $customerName,
            'notes' => $b['notes'] ?? null,
        ]);
        Response::json(['id' => $id]);
    }

    public function show(array $p): void
    {
        $c = Auth::requireUser();
        $s = Database::pdo()->prepare('SELECT * FROM orders WHERE id = ?');
        $s->execute([$p['id']]);
        $o = $s->fetch();
        if (!$o) Response::notFound('Order');
        if ($o['user_id'] !== $c['sub'] && !in_array('admin', $c['roles'] ?? [], true)) {
            Response::forbidden();
        }
        $ev = Database::pdo()->prepare('SELECT * FROM order_events WHERE order_id = ? ORDER BY created_at');
        $ev->execute([$p['id']]);
        $ms = Database::pdo()->prepare('SELECT * FROM order_messages WHERE order_id = ? ORDER BY created_at');
        $ms->execute([$p['id']]);
        Response::json(['order' => $o, 'events' => $ev->fetchAll(), 'messages' => $ms->fetchAll()]);
    }

    public function postMessage(array $p): void
    {
        $c = Auth::requireUser();
        $b = Request::json();
        $body = trim($b['body'] ?? '');
        if (!$body) Response::error('Message body required');
        $s = Database::pdo()->prepare('SELECT user_id FROM orders WHERE id = ?');
        $s->execute([$p['id']]);
        $owner = $s->fetchColumn();
        if (!$owner) Response::notFound('Order');
        $isAdmin = in_array('admin', $c['roles'] ?? [], true);
        if ($owner !== $c['sub'] && !$isAdmin) Response::forbidden();
        Database::pdo()->prepare(
            'INSERT INTO order_messages (id,order_id,sender_id,sender_role,body) VALUES (?,?,?,?,?)'
        )->execute([
            Database::uuid(), $p['id'], $c['sub'],
            $isAdmin ? 'admin' : 'customer',
            $body,
        ]);
        Response::json(['ok' => true]);
    }

    private function logEvent(string $orderId, ?string $actorId, string $type, string $msg): void
    {
        Database::pdo()->prepare(
            'INSERT INTO order_events (id,order_id,actor_id,event_type,message) VALUES (?,?,?,?,?)'
        )->execute([Database::uuid(), $orderId, $actorId, $type, $msg]);
    }

    private function sendOrderConfirmation(array $o): void
    {
        $money = strtoupper($o['currency']) . ' ' . number_format($o['total_cents'] / 100, 2);
        $name  = $o['customer_name'] ?: 'there';
        $svc   = $o['service'] ?: 'your order';
        $ref   = substr($o['id'], 0, 8);
        $appUrl = rtrim($_ENV['APP_URL'] ?? '', '/');
        $brand  = $_ENV['BRAND_NAME'] ?? 'Emailsly';
        $logo   = $_ENV['BRAND_LOGO_URL'] ?? '';

        $mailer = Mailer::orders();

        // 1) Customer confirmation (HTML + text fallback)
        if (!empty($o['customer_email'])) {
            $html = $this->orderEmailHtml([
                'audience'  => 'customer',
                'brand'     => $brand,
                'logo'      => $logo,
                'name'      => $name,
                'ref'       => $ref,
                'service'   => $svc,
                'quantity'  => (int)$o['quantity'],
                'total'     => $money,
                'notes'     => $o['notes'] ?? '',
                'trackUrl'  => $appUrl ? "$appUrl/orders/{$o['id']}" : '',
                'customerEmail' => $o['customer_email'],
            ]);
            $mailer->send($o['customer_email'], "Order confirmed · #$ref", $html, true);
        }

        // 2) Internal copy for admins — supports comma-separated list
        $adminInboxRaw = $_ENV['ORDERS_ADMIN_INBOX'] ?? ($_ENV['ADMIN_EMAIL'] ?? '');
        $admins = array_filter(array_map('trim', explode(',', $adminInboxRaw)));
        if ($admins) {
            $adminHtml = $this->orderEmailHtml([
                'audience'  => 'admin',
                'brand'     => $brand,
                'logo'      => $logo,
                'name'      => $name,
                'ref'       => $ref,
                'service'   => $svc,
                'quantity'  => (int)$o['quantity'],
                'total'     => $money,
                'notes'     => $o['notes'] ?? '',
                'trackUrl'  => $appUrl ? "$appUrl/admin/orders/{$o['id']}" : '',
                'customerEmail' => $o['customer_email'] ?: 'n/a',
            ]);
            foreach ($admins as $addr) {
                $mailer->send($addr, "[Admin] New order #$ref — $money", $adminHtml, true, $o['customer_email'] ?: null);
            }
        }
    }

    private function orderEmailHtml(array $d): string
    {
        $isAdmin = ($d['audience'] ?? '') === 'admin';
        $brand   = htmlspecialchars($d['brand']);
        $name    = htmlspecialchars($d['name']);
        $ref     = htmlspecialchars($d['ref']);
        $svc     = htmlspecialchars($d['service']);
        $qty     = (int)$d['quantity'];
        $total   = htmlspecialchars($d['total']);
        $notes   = htmlspecialchars($d['notes'] ?? '');
        $track   = htmlspecialchars($d['trackUrl'] ?? '');
        $custEm  = htmlspecialchars($d['customerEmail'] ?? '');
        $logo    = htmlspecialchars($d['logo'] ?? '');

        $accent = '#4F7CFF';
        $bg     = '#f5f7fb';
        $card   = '#ffffff';
        $ink    = '#0f172a';
        $muted  = '#64748b';
        $border = '#e5e7eb';

        $title    = $isAdmin ? "New order received" : "Thanks for your order, $name!";
        $subtitle = $isAdmin
            ? "A new order was placed on $brand and needs your attention."
            : "We've received your order and our team is on it. You'll get delivery details shortly.";
        $ctaLabel = $isAdmin ? 'Open in admin panel' : 'Track your order';
        $badge    = $isAdmin ? 'ADMIN COPY' : 'ORDER CONFIRMED';

        $adminMeta = $isAdmin
            ? "<tr><td style=\"padding:10px 0;color:$muted;font-size:13px\">Customer</td><td style=\"padding:10px 0;text-align:right;color:$ink;font-size:13px\">$name &lt;$custEm&gt;</td></tr>"
            : '';

        $logoBlock = $logo !== ''
            ? "<img src=\"$logo\" alt=\"$brand\" style=\"height:36px;display:block\">"
            : "<div style=\"font-size:22px;font-weight:800;color:$ink;letter-spacing:-0.5px\">$brand</div>";

        $notesBlock = $notes !== ''
            ? "<div style=\"margin-top:20px;padding:14px 16px;background:#fafbff;border:1px solid $border;border-radius:10px\"><div style=\"font-size:12px;color:$muted;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px\">Notes</div><div style=\"font-size:14px;color:$ink;line-height:1.5\">$notes</div></div>"
            : '';

        $ctaBlock = $track !== ''
            ? "<div style=\"margin:28px 0 8px;text-align:center\"><a href=\"$track\" style=\"display:inline-block;background:$accent;color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:10px;font-size:14px\">$ctaLabel →</a></div>"
            : '';

        return <<<HTML
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>$title</title></head>
<body style="margin:0;padding:0;background:$bg;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:$ink">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:$bg;padding:32px 12px">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
      <tr><td style="padding:0 8px 20px">$logoBlock</td></tr>
      <tr><td style="background:$card;border:1px solid $border;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,$accent,#7c5cff);padding:6px 0"></div>
        <div style="padding:36px 40px 32px">
          <div style="display:inline-block;padding:4px 10px;background:#eef2ff;color:$accent;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.8px;margin-bottom:16px">$badge</div>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:$ink;letter-spacing:-0.4px">$title</h1>
          <p style="margin:0 0 24px;font-size:15px;color:$muted;line-height:1.55">$subtitle</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid $border">
            <tr><td style="padding:14px 0;color:$muted;font-size:13px">Order reference</td><td style="padding:14px 0;text-align:right;color:$ink;font-size:13px;font-weight:600">#$ref</td></tr>
            <tr><td style="padding:10px 0;border-top:1px solid $border;color:$muted;font-size:13px">Service</td><td style="padding:10px 0;border-top:1px solid $border;text-align:right;color:$ink;font-size:13px">$svc</td></tr>
            <tr><td style="padding:10px 0;border-top:1px solid $border;color:$muted;font-size:13px">Quantity</td><td style="padding:10px 0;border-top:1px solid $border;text-align:right;color:$ink;font-size:13px">$qty</td></tr>
            $adminMeta
            <tr><td style="padding:14px 0;border-top:2px solid $ink;color:$ink;font-size:15px;font-weight:700">Total</td><td style="padding:14px 0;border-top:2px solid $ink;text-align:right;color:$ink;font-size:18px;font-weight:800">$total</td></tr>
          </table>
          $notesBlock
          $ctaBlock
        </div>
      </td></tr>
      <tr><td style="padding:20px 12px 4px;text-align:center;color:$muted;font-size:12px;line-height:1.6">
        You're receiving this because an order was placed with $brand.<br>
        Reply to this email if you have any questions — our team responds within a few hours.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>
HTML;
    }
}

