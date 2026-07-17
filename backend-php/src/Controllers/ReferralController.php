<?php
namespace Emailsly\Controllers;
use Emailsly\{Auth, Database, Request, Response};

final class ReferralController
{
    public function me(): void
    {
        $c = Auth::requireUser();
        $pdo = Database::pdo();
        $p = $pdo->prepare('SELECT referral_code FROM profiles WHERE user_id = ?');
        $p->execute([$c['sub']]);
        $code = $p->fetchColumn();
        $b = $pdo->prepare('SELECT COALESCE(SUM(delta_cents),0) FROM referral_credits WHERE user_id = ?');
        $b->execute([$c['sub']]);
        $r = $pdo->prepare('SELECT * FROM referrals WHERE referrer_id = ? ORDER BY created_at DESC LIMIT 100');
        $r->execute([$c['sub']]);
        Response::json(['code' => $code, 'balance_cents' => (int)$b->fetchColumn(), 'referrals' => $r->fetchAll()]);
    }
    public function redeem(): void
    {
        $c = Auth::requireUser();
        $b = Request::json();
        $orderId = $b['order_id'] ?? '';
        $req = max(0, (int)($b['requested_cents'] ?? 0));
        $sub = max(0, (int)($b['subtotal_cents'] ?? 0));
        $pdo = Database::pdo();
        $o = $pdo->prepare('SELECT user_id FROM orders WHERE id = ?');
        $o->execute([$orderId]);
        if ($o->fetchColumn() !== $c['sub']) Response::forbidden();
        $bal = $pdo->prepare('SELECT COALESCE(SUM(delta_cents),0) FROM referral_credits WHERE user_id = ?');
        $bal->execute([$c['sub']]);
        $spend = min($req, (int)$bal->fetchColumn(), $sub);
        if ($spend <= 0) Response::json(['spent_cents' => 0]);
        $pdo->prepare('INSERT INTO referral_credits (id,user_id,delta_cents,source,order_id,notes) VALUES (?,?,?, "referral_redeemed", ?, "Applied at checkout")')
            ->execute([Database::uuid(), $c['sub'], -$spend, $orderId]);
        $pdo->prepare('UPDATE orders SET discount_cents = discount_cents + ?, total_cents = GREATEST(0, total_cents - ?) WHERE id = ?')
            ->execute([$spend, $spend, $orderId]);
        Response::json(['spent_cents' => $spend]);
    }
    public function trackClick(): void
    {
        $b = Request::json();
        Database::pdo()->prepare(
            'INSERT INTO referral_clicks (id,referral_code,visitor_id,referrer_url,landing_url,utm,ip_address,user_agent)
             VALUES (?,?,?,?,?,?,?,?)'
        )->execute([
            Database::uuid(), $b['code'] ?? '', $b['visitor_id'] ?? null,
            $b['referrer_url'] ?? null, $b['landing_url'] ?? null,
            isset($b['utm']) ? json_encode($b['utm']) : null,
            Request::ip(), substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
        ]);
        Response::json(['ok' => true]);
    }
}
