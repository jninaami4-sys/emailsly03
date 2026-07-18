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
            'items' => $b['metadata']['items'] ?? null,
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
        $ref   = strtoupper(substr($o['id'], 0, 8));
        $appUrl = rtrim($_ENV['APP_URL'] ?? '', '/');
        $brand  = $_ENV['BRAND_NAME'] ?? 'Emailsly';
        $logo   = $_ENV['BRAND_LOGO_URL'] ?? '';
        // Prefer live brand logo saved from admin panel (site_settings.brand_logo_url)
        try {
            $row = Database::pdo()->query('SELECT brand_name, brand_logo_url FROM site_settings WHERE id = 1')->fetch();
            if ($row) {
                if (!empty($row['brand_logo_url'])) {
                    $dbLogo = $row['brand_logo_url'];
                    // Resolve relative URLs against APP_URL so they render in email clients
                    if ($dbLogo[0] === '/' && $appUrl) $dbLogo = $appUrl . $dbLogo;
                    $logo = $dbLogo;
                }
                if (!empty($row['brand_name'])) $brand = $row['brand_name'];
            }
        } catch (\Throwable $e) { /* fall back to env */ }
        $items  = $o['items'] ?? null;

        $mailer = Mailer::orders();

        if (!empty($o['customer_email'])) {
            $html = $this->orderEmailHtml([
                'audience'  => 'customer',
                'brand'     => $brand,
                'logo'      => $logo,
                'name'      => $name,
                'ref'       => $ref,
                'service'   => $svc,
                'items'     => $items,
                'quantity'  => (int)$o['quantity'],
                'total'     => $money,
                'notes'     => $o['notes'] ?? '',
                'trackUrl'  => $appUrl ? "$appUrl/orders/{$o['id']}" : '',
                'customerEmail' => $o['customer_email'],
            ]);
            $mailer->send($o['customer_email'], "Order confirmed · #$ref", $html, true);
        }

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
                'items'     => $items,
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
        $items   = is_array($d['items'] ?? null) ? $d['items'] : null;

        // Premium palette — matches site: deep navy + electric blue
        $bg      = '#0a0f1e';   // page bg
        $panel   = '#0f1729';   // card bg
        $panel2  = '#131c33';   // inner rows
        $ink     = '#e8eefc';
        $muted   = '#8ea0c4';
        $border  = '#1e2a44';
        $accent  = '#418df1';
        $accent2 = '#6ba7ff';

        $title    = $isAdmin ? "New order received" : "Thanks for your order, $name";
        $subtitle = $isAdmin
            ? "A new order was placed on $brand and needs your attention."
            : "We've received your order and our team is on it. You'll get delivery details shortly.";
        $ctaLabel = $isAdmin ? 'Open in admin panel' : 'Track your order';
        $badge    = $isAdmin ? 'ADMIN COPY' : 'ORDER CONFIRMED';

        $logoBlock = $logo !== ''
            ? "<img src=\"$logo\" alt=\"$brand\" style=\"height:40px;display:block\">"
            : "<div style=\"display:flex;align-items:center;gap:10px\"><div style=\"width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,$accent,$accent2);box-shadow:0 6px 20px rgba(65,141,241,0.45)\"></div><div style=\"font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.6px\">$brand</div></div>";

        // Items table
        if ($items && count($items) > 0) {
            $rows = '';
            foreach ($items as $it) {
                $iname = htmlspecialchars($it['name'] ?? '');
                $idesc = htmlspecialchars($it['description'] ?? '');
                $iqty  = (int)($it['quantity'] ?? 1);
                $iprice = htmlspecialchars($it['price'] ?? '');
                $rows .= "<tr>"
                    . "<td style=\"padding:16px 20px;border-top:1px solid $border;vertical-align:top\">"
                    . "<div style=\"color:$ink;font-size:14px;font-weight:600;line-height:1.4\">$iname</div>"
                    . ($idesc ? "<div style=\"color:$muted;font-size:12px;margin-top:4px;line-height:1.5\">$idesc</div>" : "")
                    . "</td>"
                    . "<td style=\"padding:16px 12px;border-top:1px solid $border;text-align:center;color:$muted;font-size:13px;vertical-align:top\">×$iqty</td>"
                    . "<td style=\"padding:16px 20px;border-top:1px solid $border;text-align:right;color:$ink;font-size:14px;font-weight:600;vertical-align:top\">$iprice</td>"
                    . "</tr>";
            }
            $itemsBlock = "<div style=\"margin-top:24px;border:1px solid $border;border-radius:12px;overflow:hidden;background:$panel2\">"
                . "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">"
                . "<tr><td style=\"padding:12px 20px;background:rgba(65,141,241,0.08);color:$accent2;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase\">Item</td>"
                . "<td style=\"padding:12px 12px;background:rgba(65,141,241,0.08);text-align:center;color:$accent2;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase\">Qty</td>"
                . "<td style=\"padding:12px 20px;background:rgba(65,141,241,0.08);text-align:right;color:$accent2;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase\">Price</td></tr>"
                . $rows
                . "</table></div>";
        } else {
            $itemsBlock = "<div style=\"margin-top:24px;border:1px solid $border;border-radius:12px;overflow:hidden;background:$panel2;padding:20px\">"
                . "<div style=\"color:$muted;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px\">Service</div>"
                . "<div style=\"color:$ink;font-size:15px;font-weight:600\">$svc</div>"
                . "<div style=\"color:$muted;font-size:13px;margin-top:4px\">Quantity: $qty</div>"
                . "</div>";
        }

        $adminMeta = $isAdmin
            ? "<tr><td style=\"padding:12px 0;color:$muted;font-size:13px\">Customer</td><td style=\"padding:12px 0;text-align:right;color:$ink;font-size:13px\">$name &lt;$custEm&gt;</td></tr>"
            : '';

        $notesBlock = $notes !== ''
            ? "<div style=\"margin-top:20px;padding:16px 18px;background:$panel2;border:1px solid $border;border-radius:12px\"><div style=\"font-size:11px;color:$accent2;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:8px\">Notes</div><div style=\"font-size:14px;color:$ink;line-height:1.55\">$notes</div></div>"
            : '';

        $ctaBlock = $track !== ''
            ? "<div style=\"margin:32px 0 8px;text-align:center\"><a href=\"$track\" style=\"display:inline-block;background:linear-gradient(135deg,$accent,$accent2);color:#fff;text-decoration:none;font-weight:700;padding:15px 34px;border-radius:12px;font-size:14px;letter-spacing:0.2px;box-shadow:0 10px 30px rgba(65,141,241,0.4)\">$ctaLabel  →</a></div>"
            : '';

        return <<<HTML
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>$title</title></head>
<body style="margin:0;padding:0;background:$bg;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;color:$ink">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:$bg;padding:40px 12px">
  <tr><td align="center">
    <table role="presentation" width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%">
      <tr><td style="padding:0 4px 24px">$logoBlock</td></tr>
      <tr><td style="background:$panel;border:1px solid $border;border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,0.4)">
        <div style="background:linear-gradient(135deg,$accent 0%,$accent2 50%,#8ab8ff 100%);height:4px"></div>
        <div style="padding:40px 44px 36px">
          <div style="display:inline-block;padding:6px 12px;background:rgba(65,141,241,0.15);color:$accent2;border:1px solid rgba(65,141,241,0.35);border-radius:999px;font-size:10px;font-weight:800;letter-spacing:1.2px;margin-bottom:20px">$badge</div>
          <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.6px;line-height:1.2">$title</h1>
          <p style="margin:0 0 8px;font-size:15px;color:$muted;line-height:1.6">$subtitle</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-top:1px solid $border">
            <tr><td style="padding:16px 0;color:$muted;font-size:13px">Order reference</td><td style="padding:16px 0;text-align:right;color:#fff;font-size:14px;font-weight:700;font-family:'SF Mono',Menlo,monospace">#$ref</td></tr>
            $adminMeta
          </table>

          $itemsBlock

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px">
            <tr>
              <td style="padding:18px 20px;background:linear-gradient(135deg,rgba(65,141,241,0.12),rgba(107,167,255,0.08));border:1px solid rgba(65,141,241,0.3);border-radius:12px;color:#fff;font-size:15px;font-weight:700;letter-spacing:0.2px">Total</td>
              <td style="padding:18px 20px;background:linear-gradient(135deg,rgba(65,141,241,0.12),rgba(107,167,255,0.08));border:1px solid rgba(65,141,241,0.3);border-left:none;border-radius:12px;text-align:right;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.3px">$total</td>
            </tr>
          </table>

          $notesBlock
          $ctaBlock
        </div>
      </td></tr>
      <tr><td style="padding:24px 12px 4px;text-align:center;color:$muted;font-size:12px;line-height:1.7">
        You're receiving this because an order was placed with <span style="color:$accent2;font-weight:600">$brand</span>.<br>
        Reply to this email if you have any questions — our team responds within a few hours.
      </td></tr>
      <tr><td style="padding:14px 12px 0;text-align:center;color:#4a5878;font-size:11px;letter-spacing:0.3px">
        © $brand · Premium lead data & email infrastructure
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>
HTML;
    }
}

