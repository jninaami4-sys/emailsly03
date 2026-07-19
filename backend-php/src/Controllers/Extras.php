<?php
namespace Emailsly\Controllers;

use Emailsly\{Auth, Database, Mailer, RateLimit, Request, Response};

/**
 * Kitchen-sink controller closing every gap the frontend api-client.ts
 * calls that isn't handled by a dedicated feature controller.
 * Grouped by feature area — one static-style class to keep the diff
 * contained. Auth gates are declared per method.
 */
final class Extras
{
    private static function pdo(): \PDO { return Database::pdo(); }

    // =====================================================================
    // OTP (signup / email verify)
    // =====================================================================
    public function otpResend(): void
    {
        RateLimit::check('otp_resend', 5, 300);
        $b = Request::json();
        $email = strtolower(trim($b['email'] ?? ''));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) Response::error('Invalid email');
        $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        // otp_codes.code is VARCHAR(10) — store the 6-digit code in plaintext
        // (short-lived, rate-limited, single-use).
        self::pdo()->prepare(
            'INSERT INTO otp_codes (id, email, code, purpose, expires_at)
             VALUES (?,?,?, "signup", DATE_ADD(NOW(), INTERVAL 15 MINUTE))'
        )->execute([Database::uuid(), $email, $code]);
        Mailer::auth()->send(
            $email,
            'Your Emailsly verification code',
            "Your verification code is:\n\n    $code\n\nExpires in 15 minutes.\n\nIf this wasn't you, ignore this email.\n\n(Please check Spam / Junk / Promotions folders as well.)"
        );
        Response::json(['ok' => true]);
    }

    public function otpVerify(): void
    {
        RateLimit::check('otp_verify', 10, 300);
        $b = Request::json();
        $email = strtolower(trim($b['email'] ?? ''));
        $code  = trim((string)($b['code'] ?? ''));
        if (!$email || !$code) Response::error('Missing email or code');
        $s = self::pdo()->prepare(
            'SELECT id, code FROM otp_codes
             WHERE email = ? AND purpose = "signup" AND consumed_at IS NULL AND expires_at > NOW()
             ORDER BY created_at DESC LIMIT 5'
        );
        $s->execute([$email]);
        foreach ($s->fetchAll() as $row) {
            if (hash_equals((string)$row['code'], $code)) {
                self::pdo()->prepare('UPDATE otp_codes SET consumed_at = NOW() WHERE id = ?')->execute([$row['id']]);
                self::pdo()->prepare('UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()) WHERE email = ?')
                    ->execute([$email]);
                Response::json(['ok' => true, 'verified' => true]);
            }
        }
        Response::error('Invalid or expired code', 400);
    }

    // =====================================================================
    // Public site aliases  (/api/site-settings, /api/site-content[/*], /api/announcements, /api/social-links)
    // =====================================================================
    public function siteSettings(): void
    {
        $s = self::pdo()->query('SELECT * FROM site_settings WHERE id = 1');
        Response::json(['settings' => $s->fetch() ?: null]);
    }
    public function siteContentList(): void
    {
        $rows = self::pdo()->query('SELECT `key`, value FROM site_content')->fetchAll();
        $out = [];
        foreach ($rows as $r) $out[] = ['key' => $r['key'], 'content' => json_decode($r['value'] ?? 'null', true)];
        Response::json(['sections' => $out]);
    }
    public function siteContentGet(array $p): void
    {
        $s = self::pdo()->prepare('SELECT value FROM site_content WHERE `key` = ?');
        $s->execute([$p['section']]);
        $raw = $s->fetchColumn();
        Response::json(['content' => $raw === false ? null : json_decode($raw, true)]);
    }
    public function announcementsPublic(): void
    {
        $s = self::pdo()->query(
            'SELECT * FROM announcements
             WHERE is_active = 1
               AND (start_at IS NULL OR start_at <= NOW())
               AND (end_at IS NULL OR end_at >= NOW())
             ORDER BY priority DESC, created_at DESC'
        );
        Response::json(['announcements' => $s->fetchAll()]);
    }
    public function socialLinksPublic(): void
    {
        $s = self::pdo()->query('SELECT * FROM social_links WHERE is_active = 1 ORDER BY sort_order');
        Response::json(['links' => $s->fetchAll()]);
    }

    // =====================================================================
    // Admin site aliases
    // =====================================================================
    public function adminSiteSettingsGet(): void
    {
        Auth::requireAdmin();
        $s = self::pdo()->query('SELECT * FROM site_settings WHERE id = 1');
        Response::json(['settings' => $s->fetch() ?: null]);
    }
    public function adminSiteSettingsUpdate(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $allow = ['brand_name','brand_tagline','brand_logo_url','brand_logo_white_url','favicon_url','support_show_category','contact_email','contact_phone','invoice_logo_url','footer_logo_url'];
        $f = []; $v = [];
        foreach ($allow as $k) if (array_key_exists($k, $b)) { $f[] = "$k = ?"; $v[] = $b[$k]; }
        if ($f) self::pdo()->prepare('UPDATE site_settings SET ' . implode(',', $f) . ' WHERE id = 1')->execute($v);
        $s = self::pdo()->query('SELECT * FROM site_settings WHERE id = 1');
        Response::json(['settings' => $s->fetch() ?: null]);
    }
    public function adminSiteContentUpsert(array $p): void
    {
        $c = Auth::requireAdmin();
        $b = Request::json();
        self::pdo()->prepare(
            'INSERT INTO site_content (`key`, value, updated_by) VALUES (?,?,?)
             ON DUPLICATE KEY UPDATE value = VALUES(value), updated_by = VALUES(updated_by)'
        )->execute([$p['section'], json_encode($b['content'] ?? null), $c['sub']]);
        Response::json(['ok' => true]);
    }
    public function adminSocialLinksList(): void
    {
        Auth::requireAdmin();
        Response::json(['links' => self::pdo()->query('SELECT * FROM social_links ORDER BY sort_order')->fetchAll()]);
    }
    public function adminSocialLinksUpsert(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $id = $b['id'] ?? Database::uuid();
        self::pdo()->prepare(
            'INSERT INTO social_links (id,platform,url,label,icon,sort_order,is_active) VALUES (?,?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE platform=VALUES(platform), url=VALUES(url), label=VALUES(label), icon=VALUES(icon), sort_order=VALUES(sort_order), is_active=VALUES(is_active)'
        )->execute([
            $id, $b['platform'] ?? '', $b['url'] ?? '', $b['label'] ?? null,
            $b['icon'] ?? null, (int)($b['sort_order'] ?? 0), (int)($b['is_active'] ?? 1),
        ]);
        Response::json(['id' => $id, 'ok' => true]);
    }
    public function adminSocialLinksDelete(array $p): void
    {
        Auth::requireAdmin();
        self::pdo()->prepare('DELETE FROM social_links WHERE id = ?')->execute([$p['id']]);
        Response::json(['ok' => true]);
    }

    // =====================================================================
    // Uploads aliases (/api/uploads*)
    // =====================================================================
    public function uploadsSign(): void
    {
        Auth::requireUser();
        $b = Request::json();
        $bucket = (string)($b['bucket'] ?? '');
        $path   = ltrim((string)($b['path'] ?? ''), '/');
        if (str_contains($path, '..') || !$bucket || !$path) Response::error('Invalid');
        // Public-URL style (Apache serves /uploads directly). Signed URLs would need
        // a secret + expiry HMAC; we return the same public URL + a synthetic expiry.
        $publicBase = rtrim($_ENV['UPLOADS_PUBLIC_URL'] ?? (($_ENV['APP_URL'] ?? '') . '/uploads'), '/');
        Response::json([
            'url'        => "$publicBase/$bucket/$path",
            'expires_at' => gmdate('c', time() + (int)($b['expires_in'] ?? 3600)),
        ]);
    }
    public function uploadsDelete(): void
    {
        $c = Auth::requireUser();
        $bucket = (string)($_GET['bucket'] ?? '');
        $path   = ltrim((string)($_GET['path'] ?? ''), '/');
        if (!$bucket || !$path || str_contains($path, '..')) Response::error('Invalid');
        if (!in_array('admin', $c['roles'] ?? [], true)) {
            // Non-admins may only delete their own avatars/reviews paths.
            if (!in_array($bucket, ['avatars','reviews'], true)) Response::forbidden();
        }
        $baseDir = rtrim($_ENV['UPLOADS_DIR'] ?? (dirname(__DIR__, 2) . '/uploads'), '/');
        $full = "$baseDir/$bucket/$path";
        if (is_file($full)) @unlink($full);
        Response::json(['ok' => true]);
    }

    // =====================================================================
    // Support tickets aliases (frontend uses /api/tickets)
    // =====================================================================
    public function ticketsList(): void       { (new SupportController)->listMine(); }
    public function ticketsCreate(): void     { (new SupportController)->create(); }
    public function ticketsShow(array $p): void   { (new SupportController)->show($p); }
    public function ticketsMessage(array $p): void { (new SupportController)->postMessage($p); }
    public function ticketsClose(array $p): void
    {
        $c = Auth::requireUser();
        $s = self::pdo()->prepare('SELECT user_id FROM support_tickets WHERE id = ?');
        $s->execute([$p['id']]);
        $owner = $s->fetchColumn();
        if (!$owner) Response::notFound();
        $isAdmin = in_array('admin', $c['roles'] ?? [], true);
        if ($owner !== $c['sub'] && !$isAdmin) Response::forbidden();
        self::pdo()->prepare('UPDATE support_tickets SET status = "closed" WHERE id = ?')->execute([$p['id']]);
        Response::json(['ok' => true]);
    }
    public function adminTicketsList(): void
    {
        Auth::requireAdmin();
        $status = $_GET['status'] ?? null;
        $q = $_GET['search'] ?? null;
        $sql = 'SELECT * FROM support_tickets WHERE 1=1';
        $args = [];
        if ($status) { $sql .= ' AND status = ?'; $args[] = $status; }
        if ($q)      { $sql .= ' AND (subject LIKE ? OR description LIKE ?)'; $args[] = "%$q%"; $args[] = "%$q%"; }
        $sql .= ' ORDER BY created_at DESC LIMIT 500';
        $s = self::pdo()->prepare($sql);
        $s->execute($args);
        Response::json(['tickets' => $s->fetchAll()]);
    }
    public function adminTicketsShow(array $p): void
    {
        Auth::requireAdmin();
        $s = self::pdo()->prepare('SELECT * FROM support_tickets WHERE id = ?');
        $s->execute([$p['id']]);
        $t = $s->fetch();
        if (!$t) Response::notFound();
        $m = self::pdo()->prepare('SELECT * FROM support_ticket_messages WHERE ticket_id = ? ORDER BY created_at');
        $m->execute([$p['id']]);
        Response::json(['ticket' => $t, 'messages' => $m->fetchAll()]);
    }
    public function adminTicketsPostMessage(array $p): void
    {
        $c = Auth::requireAdmin();
        $b = Request::json();
        $body = trim((string)($b['body'] ?? ''));
        if (!$body) Response::error('Message body required');
        self::pdo()->prepare(
            'INSERT INTO support_ticket_messages (id,ticket_id,sender_id,sender_role,body) VALUES (?,?,?, "admin", ?)'
        )->execute([Database::uuid(), $p['id'], $c['sub'], $body]);
        if (!empty($b['status'])) {
            self::pdo()->prepare('UPDATE support_tickets SET status = ?, last_message_at = NOW() WHERE id = ?')
                ->execute([$b['status'], $p['id']]);
        } else {
            self::pdo()->prepare('UPDATE support_tickets SET last_message_at = NOW() WHERE id = ?')
                ->execute([$p['id']]);
        }
        Response::json(['ok' => true]);
    }

    // =====================================================================
    // Users (admin) — client shape /api/admin/users/roles POST {user_id, role, enabled}
    // =====================================================================
    public function adminUsersToggleRole(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $uid = (string)($b['user_id'] ?? '');
        $role = (string)($b['role'] ?? '');
        $enabled = (bool)($b['enabled'] ?? false);
        if (!$uid || !in_array($role, ['admin','moderator','user'], true)) Response::error('Bad input');
        $pdo = self::pdo();
        if ($enabled) {
            $pdo->prepare('INSERT IGNORE INTO user_roles (id,user_id,role) VALUES (?,?,?)')
                ->execute([Database::uuid(), $uid, $role]);
        } else {
            $pdo->prepare('DELETE FROM user_roles WHERE user_id = ? AND role = ?')->execute([$uid, $role]);
        }
        Response::json(['ok' => true]);
    }
    public function adminUsersUpdate(array $p): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $allow = ['full_name','company','phone','bio','avatar_url'];
        $f = []; $v = [];
        foreach ($allow as $k) if (array_key_exists($k, $b)) { $f[] = "$k = ?"; $v[] = $b[$k]; }
        if ($f) {
            $v[] = $p['id'];
            self::pdo()->prepare('UPDATE profiles SET ' . implode(',', $f) . ' WHERE user_id = ?')->execute($v);
        }
        Response::json(['ok' => true]);
    }

    // =====================================================================
    // Reviews
    // =====================================================================
    public function reviewsMine(): void
    {
        $c = Auth::requireUser();
        $s = self::pdo()->prepare('SELECT * FROM reviews WHERE user_id = ? ORDER BY created_at DESC');
        $s->execute([$c['sub']]);
        Response::json(['reviews' => $s->fetchAll()]);
    }
    public function reviewsModerate(array $p): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $action = (string)($b['action'] ?? '');
        if ($action === 'delete') {
            self::pdo()->prepare('DELETE FROM reviews WHERE id = ?')->execute([$p['id']]);
        } else {
            $status = $action === 'approve' ? 'approved' : ($action === 'reject' ? 'rejected' : null);
            if (!$status) Response::error('Bad action');
            self::pdo()->prepare('UPDATE reviews SET status = ?, moderation_reason = ? WHERE id = ?')
                ->execute([$status, $b['reason'] ?? null, $p['id']]);
        }
        Response::json(['ok' => true]);
    }

    // =====================================================================
    // Orders — invoice payload
    // =====================================================================
    public function orderInvoice(array $p): void
    {
        $c = Auth::requireUser();
        $s = self::pdo()->prepare('SELECT * FROM orders WHERE id = ?');
        $s->execute([$p['id']]);
        $o = $s->fetch();
        if (!$o) Response::notFound();
        $isAdmin = in_array('admin', $c['roles'] ?? [], true);
        if ($o['user_id'] !== $c['sub'] && !$isAdmin) Response::forbidden();
        $company = self::pdo()->query('SELECT * FROM site_settings WHERE id = 1')->fetch() ?: [];
        Response::json([
            'order'   => $o,
            'company' => $company,
            'invoice' => [
                'number'   => 'INV-' . strtoupper(substr($o['id'], 0, 8)),
                'issued'   => $o['created_at'],
                'currency' => $o['currency'] ?? 'USD',
            ],
        ]);
    }

    // =====================================================================
    // Pricing — publish toggle + audit
    // =====================================================================
    public function pricingPublish(array $p): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        self::pdo()->prepare('UPDATE pricing_settings SET published = ? WHERE id = ?')
            ->execute([(int)($b['published'] ?? 0), $p['id']]);
        Response::json(['ok' => true]);
    }
    public function pricingAudit(): void
    {
        Auth::requireAdmin();
        $rows = self::pdo()->query('SELECT * FROM pricing_settings_audit ORDER BY created_at DESC LIMIT 500')->fetchAll();
        Response::json(['audit' => $rows]);
    }

    // =====================================================================
    // Referrals
    // =====================================================================
    public function referralsAttach(): void
    {
        $c = Auth::requireUser();
        $code = trim((string)(Request::json()['code'] ?? ''));
        if (!$code) Response::error('Missing code');
        $s = self::pdo()->prepare('SELECT user_id FROM profiles WHERE referral_code = ?');
        $s->execute([$code]);
        $refId = $s->fetchColumn();
        if (!$refId) Response::json(['ok' => false, 'reason' => 'unknown_code']);
        if ($refId === $c['sub']) Response::json(['ok' => false, 'reason' => 'self']);
        // Only attach if not already attached.
        $mine = self::pdo()->prepare('SELECT referred_by_user_id FROM profiles WHERE user_id = ?');
        $mine->execute([$c['sub']]);
        if ($mine->fetchColumn()) Response::json(['ok' => false, 'reason' => 'already_attached']);
        self::pdo()->prepare('UPDATE profiles SET referred_by_user_id = ? WHERE user_id = ?')
            ->execute([$refId, $c['sub']]);
        self::pdo()->prepare('INSERT IGNORE INTO referrals (id, referrer_id, referred_user_id, status) VALUES (?,?,?, "pending")')
            ->execute([Database::uuid(), $refId, $c['sub']]);
        Response::json(['ok' => true]);
    }
    public function referralsBalance(): void
    {
        $c = Auth::requireUser();
        $s = self::pdo()->prepare('SELECT COALESCE(SUM(delta_cents),0) FROM referral_credits WHERE user_id = ?');
        $s->execute([$c['sub']]);
        Response::json(['balance_cents' => (int)$s->fetchColumn(), 'currency' => 'USD']);
    }
    public function adminReferralsStats(): void
    {
        Auth::requireAdmin();
        $pdo = self::pdo();
        $stats = [
            'total_referrals'   => (int)$pdo->query('SELECT COUNT(*) FROM referrals')->fetchColumn(),
            'approved'          => (int)$pdo->query('SELECT COUNT(*) FROM referrals WHERE status = "approved"')->fetchColumn(),
            'pending'           => (int)$pdo->query('SELECT COUNT(*) FROM referrals WHERE status = "pending"')->fetchColumn(),
            'rejected'          => (int)$pdo->query('SELECT COUNT(*) FROM referrals WHERE status = "rejected"')->fetchColumn(),
            'clicks_last_30d'   => (int)$pdo->query('SELECT COUNT(*) FROM referral_clicks WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)')->fetchColumn(),
            'credits_owed_cents'=> (int)$pdo->query('SELECT COALESCE(SUM(delta_cents),0) FROM referral_credits WHERE source <> "payout"')->fetchColumn(),
        ];
        Response::json(['stats' => $stats]);
    }
    public function adminReferralUpdate(array $p): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $f = []; $v = [];
        // Real column is admin_review_state; accept legacy `review_state` alias from the client.
        if (array_key_exists('review_state', $b) && !array_key_exists('admin_review_state', $b)) {
            $b['admin_review_state'] = $b['review_state'];
        }
        foreach (['status','admin_review_state','notes'] as $k)
            if (array_key_exists($k, $b)) { $f[] = "$k = ?"; $v[] = $b[$k]; }
        if ($f) {
            $v[] = $p['id'];
            self::pdo()->prepare('UPDATE referrals SET ' . implode(',', $f) . ' WHERE id = ?')->execute($v);
        }
        Response::json(['ok' => true]);
    }
    public function adminReferralApprove(array $p): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        self::pdo()->prepare('UPDATE referrals SET status = "rewarded", admin_review_state = "approved", notes = ? WHERE id = ?')
            ->execute([$b['notes'] ?? null, $p['id']]);
        Response::json(['ok' => true]);
    }
    public function adminReferralReject(array $p): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        self::pdo()->prepare('UPDATE referrals SET status = "cancelled", admin_review_state = "rejected", notes = ? WHERE id = ?')
            ->execute([$b['notes'] ?? null, $p['id']]);
        Response::json(['ok' => true]);
    }
    public function adminReferralChain(): void
    {
        Auth::requireAdmin();
        $refId = (string)($_GET['referrer_id'] ?? '');
        $s = self::pdo()->prepare(
            'SELECT r.*, p.full_name, u.email FROM referrals r
             LEFT JOIN profiles p ON p.user_id = r.referred_user_id
             LEFT JOIN users u ON u.id = r.referred_user_id
             WHERE r.referrer_id = ? ORDER BY r.created_at DESC'
        );
        $s->execute([$refId]);
        Response::json(['chain' => ['referrer_id' => $refId, 'nodes' => $s->fetchAll()]]);
    }
    public function adminReferralFunnel(): void
    {
        Auth::requireAdmin();
        $days = max(1, min(365, (int)($_GET['days'] ?? 30)));
        $pdo = self::pdo();
        Response::json(['funnel' => [
            'days'      => $days,
            'clicks'    => (int)$pdo->query("SELECT COUNT(*) FROM referral_clicks WHERE created_at > DATE_SUB(NOW(), INTERVAL $days DAY)")->fetchColumn(),
            'signups'   => (int)$pdo->query("SELECT COUNT(*) FROM referrals WHERE created_at > DATE_SUB(NOW(), INTERVAL $days DAY)")->fetchColumn(),
            'approved'  => (int)$pdo->query("SELECT COUNT(*) FROM referrals WHERE admin_review_state = 'approved' AND created_at > DATE_SUB(NOW(), INTERVAL $days DAY)")->fetchColumn(),
        ]]);
    }
    public function adminReferralLeaderboard(): void
    {
        Auth::requireAdmin();
        $limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
        $s = self::pdo()->query(
            "SELECT r.referrer_id, u.email, p.full_name, COUNT(*) as total,
                    SUM(CASE WHEN r.admin_review_state='approved' THEN 1 ELSE 0 END) as approved
             FROM referrals r
             LEFT JOIN users u ON u.id = r.referrer_id
             LEFT JOIN profiles p ON p.user_id = r.referrer_id
             GROUP BY r.referrer_id
             ORDER BY approved DESC, total DESC
             LIMIT $limit"
        );
        Response::json(['leaderboard' => $s->fetchAll()]);
    }
    public function adminReferralPayout(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $ids = array_values(array_filter((array)($b['user_ids'] ?? []), 'is_string'));
        if (!$ids) Response::json(['batch_id' => null, 'count' => 0, 'total_cents' => 0]);
        $pdo = self::pdo();
        $ph = implode(',', array_fill(0, count($ids), '?'));
        $bal = $pdo->prepare("SELECT user_id, COALESCE(SUM(delta_cents),0) as bal FROM referral_credits WHERE user_id IN ($ph) GROUP BY user_id");
        $bal->execute($ids);
        $rows = $bal->fetchAll();
        $batchId = Database::uuid();
        $total = 0; $count = 0;
        $pdo->prepare('INSERT INTO referral_payout_batches (id, created_by, notes) VALUES (?,?,?)')
            ->execute([$batchId, null, $b['notes'] ?? null]);
        $ins = $pdo->prepare('INSERT INTO referral_credits (id, user_id, delta_cents, source, batch_id, notes) VALUES (?,?,?, "payout", ?, ?)');
        foreach ($rows as $r) {
            if ((int)$r['bal'] <= 0) continue;
            $ins->execute([Database::uuid(), $r['user_id'], -(int)$r['bal'], $batchId, 'Paid out']);
            $total += (int)$r['bal']; $count++;
        }
        Response::json(['batch_id' => $batchId, 'count' => $count, 'total_cents' => $total]);
    }
    public function adminReferralOwedCsv(): void
    {
        Auth::requireAdmin();
        $rows = self::pdo()->query(
            "SELECT p.user_id, u.email, p.full_name,
                    COALESCE(SUM(rc.delta_cents),0) AS owed_cents
             FROM profiles p
             LEFT JOIN users u ON u.id = p.user_id
             LEFT JOIN referral_credits rc ON rc.user_id = p.user_id
             GROUP BY p.user_id HAVING owed_cents > 0
             ORDER BY owed_cents DESC"
        )->fetchAll();
        $csv = "user_id,email,name,owed_cents\n";
        foreach ($rows as $r) {
            $csv .= sprintf("%s,%s,%s,%d\n",
                $r['user_id'], str_replace(',', ' ', (string)$r['email']),
                str_replace(',', ' ', (string)$r['full_name']), (int)$r['owed_cents']);
        }
        Response::json(['csv' => $csv, 'count' => count($rows)]);
    }

    // =====================================================================
    // Blog analytics + SEO
    // =====================================================================
    public function blogAnalyticsTrack(): void
    {
        RateLimit::check('blog_track', 60, 60);
        $b = Request::json();
        self::pdo()->prepare(
            'INSERT INTO blog_analytics_events (id, post_slug, event_type, session_id, path, referrer, meta, ip_address, user_agent)
             VALUES (?,?,?,?,?,?,?,?,?)'
        )->execute([
            Database::uuid(),
            (string)($b['slug'] ?? ''),
            (string)($b['event_type'] ?? 'view'),
            $b['session_id'] ?? null,
            $b['path'] ?? null,
            $b['referrer'] ?? null,
            isset($b['meta']) ? json_encode($b['meta']) : null,
            Request::ip(),
            substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
        ]);
        Response::json(['ok' => true]);
    }
    public function blogAnalyticsSummary(): void
    {
        Auth::requireAdmin();
        $days = max(1, min(365, (int)($_GET['days'] ?? 30)));
        $s = self::pdo()->query(
            "SELECT post_slug, event_type, COUNT(*) AS n
             FROM blog_analytics_events
             WHERE created_at > DATE_SUB(NOW(), INTERVAL $days DAY)
             GROUP BY post_slug, event_type
             ORDER BY n DESC LIMIT 500"
        );
        Response::json(['rows' => $s->fetchAll()]);
    }
    public function blogAnalyticsSlug(): void
    {
        Auth::requireAdmin();
        $slug = (string)($_GET['slug'] ?? '');
        $days = max(1, min(365, (int)($_GET['days'] ?? 30)));
        $s = self::pdo()->prepare(
            "SELECT event_type, COUNT(*) AS n FROM blog_analytics_events
             WHERE post_slug = ? AND created_at > DATE_SUB(NOW(), INTERVAL $days DAY)
             GROUP BY event_type"
        );
        $s->execute([$slug]);
        Response::json(['report' => ['slug' => $slug, 'days' => $days, 'events' => $s->fetchAll()]]);
    }
    public function blogSeoPublic(array $p): void
    {
        $s = self::pdo()->prepare('SELECT * FROM blog_seo_overrides WHERE post_slug = ?');
        $s->execute([$p['slug']]);
        Response::json(['override' => $s->fetch() ?: null]);
    }
    public function adminBlogSeoList(): void
    {
        Auth::requireAdmin();
        Response::json(['overrides' => self::pdo()->query('SELECT * FROM blog_seo_overrides ORDER BY updated_at DESC')->fetchAll()]);
    }
    public function adminBlogSeoUpsert(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        self::pdo()->prepare(
            'INSERT INTO blog_seo_overrides (id, post_slug, meta_title, meta_description, og_image, canonical_url)
             VALUES (?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE meta_title=VALUES(meta_title), meta_description=VALUES(meta_description),
                                    og_image=VALUES(og_image), canonical_url=VALUES(canonical_url)'
        )->execute([
            Database::uuid(), $b['post_slug'] ?? $b['slug'] ?? '',
            $b['meta_title'] ?? null, $b['meta_description'] ?? null,
            $b['og_image'] ?? null, $b['canonical_url'] ?? null,
        ]);
        Response::json(['ok' => true]);
    }
    public function adminBlogSeoDelete(array $p): void
    {
        Auth::requireAdmin();
        self::pdo()->prepare('DELETE FROM blog_seo_overrides WHERE post_slug = ?')->execute([$p['slug']]);
        Response::json(['ok' => true]);
    }

    // =====================================================================
    // Product details CMS
    // =====================================================================
    public function productDetailsPublic(array $p): void
    {
        $s = self::pdo()->prepare('SELECT * FROM product_details WHERE slug = ?');
        $s->execute([$p['slug']]);
        Response::json(['details' => $s->fetch() ?: null]);
    }
    public function adminProductDetailsList(): void
    {
        Auth::requireAdmin();
        Response::json(['items' => self::pdo()->query('SELECT * FROM product_details ORDER BY updated_at DESC')->fetchAll()]);
    }
    public function adminProductDetailsUpsert(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $slug = (string)($b['slug'] ?? '');
        if (!$slug) Response::error('slug required');
        self::pdo()->prepare(
            'INSERT INTO product_details (id, slug, data) VALUES (?,?,?)
             ON DUPLICATE KEY UPDATE data = VALUES(data)'
        )->execute([Database::uuid(), $slug, json_encode($b['data'] ?? $b)]);
        Response::json(['ok' => true, 'slug' => $slug]);
    }
    public function adminProductDetailsDelete(array $p): void
    {
        Auth::requireAdmin();
        self::pdo()->prepare('DELETE FROM product_details WHERE slug = ?')->execute([$p['slug']]);
        Response::json(['ok' => true]);
    }

    // =====================================================================
    // Chatbot — public widget surface
    // =====================================================================
    public function chatbotConfigPublic(): void
    {
        $row = self::pdo()->query('SELECT * FROM chatbot_config WHERE id = 1')->fetch();
        Response::json([
            'enabled'          => (bool)($row['enabled'] ?? true),
            'greeting'         => (string)($row['greeting'] ?? "Hi! How can we help?"),
            'human_hours_note' => (string)($row['human_hours_note'] ?? ''),
        ]);
    }
    public function chatbotKbPublic(): void
    {
        $s = self::pdo()->query('SELECT id, title, body, tags, category FROM chatbot_kb WHERE is_active = 1 ORDER BY updated_at DESC');
        Response::json(['items' => $s->fetchAll()]);
    }
    public function chatbotConversationStart(): void
    {
        RateLimit::check('chatbot_start', 30, 300);
        $b = Request::json();
        $sessionId = (string)($b['sessionId'] ?? Database::uuid());
        $tok = bin2hex(random_bytes(16));
        $id  = Database::uuid();
        self::pdo()->prepare(
            'INSERT INTO chatbot_conversations (id, session_token, visitor_name, visitor_email, metadata)
             VALUES (?,?,?,?,?)
             ON DUPLICATE KEY UPDATE session_token = session_token'
        )->execute([$id, $sessionId, $b['visitorName'] ?? null, $b['email'] ?? null,
                    isset($b['orderId']) ? json_encode(['order_ref' => $b['orderId']]) : null]);
        Response::json(['conversation' => [
            'id' => $id, 'session_id' => $sessionId, 'session_token' => $tok,
        ]]);
    }
    public function chatbotMessagesGet(): void
    {
        $sid = (string)($_GET['session_id'] ?? '');
        if (!$sid) Response::error('session_id required');
        $s = self::pdo()->prepare(
            'SELECT m.* FROM chatbot_messages m
             JOIN chatbot_conversations c ON c.id = m.conversation_id
             WHERE c.session_token = ? ORDER BY m.created_at'
        );
        $s->execute([$sid]);
        Response::json(['messages' => $s->fetchAll()]);
    }
    public function chatbotMessagePost(): void
    {
        RateLimit::check('chatbot_msg', 30, 60);
        $b = Request::json();
        $sid = (string)($b['sessionId'] ?? '');
        $cid = self::pdo()->prepare('SELECT id FROM chatbot_conversations WHERE session_token = ?');
        $cid->execute([$sid]);
        $conversationId = $cid->fetchColumn();
        if (!$conversationId) Response::error('Unknown session', 401);
        self::pdo()->prepare(
            'INSERT INTO chatbot_messages (id, conversation_id, sender, body) VALUES (?,?,?,?)'
        )->execute([Database::uuid(), $conversationId, $b['sender'] ?? 'user', (string)($b['text'] ?? '')]);
        Response::json(['ok' => true]);
    }
    public function chatbotHandoff(): void
    {
        $b = Request::json();
        $sid = (string)($b['sessionId'] ?? '');
        $note = 'Requested human handoff';
        $inbox = $_ENV['SUPPORT_ADMIN_INBOX'] ?? ($_ENV['ADMIN_EMAIL'] ?? null);
        if ($inbox) {
            Mailer::support()->send($inbox, 'Chatbot: human handoff requested',
                "Session: $sid\nLast message: " . (string)($b['lastMessage'] ?? ''));
        }
        Response::json(['ok' => true, 'note' => $note]);
    }
    public function chatbotLookupOrder(): void
    {
        // Track Order policy: no guest order data via the widget either.
        $c = Auth::requireUser();
        $b = Request::json();
        $orderId = (string)($b['orderId'] ?? '');
        $s = self::pdo()->prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?');
        $s->execute([$orderId, $c['sub']]);
        $o = $s->fetch();
        Response::json(['found' => (bool)$o, 'order' => $o ?: null]);
    }
    public function chatbotCreateOrder(): void
    {
        $c = Auth::requireUser();
        $b = Request::json();
        $id = Database::uuid();
        self::pdo()->prepare(
            'INSERT INTO chatbot_orders (id, user_id, payload, status) VALUES (?,?,?, "new")'
        )->execute([$id, $c['sub'], json_encode($b)]);
        Response::json(['order_id' => $id]);
    }
    public function chatbotCreateTicket(): void
    {
        $c = Auth::requireUser();
        $b = Request::json();
        $id = Database::uuid();
        $ref = strtoupper(substr($id, 0, 8));
        self::pdo()->prepare(
            'INSERT INTO chatbot_tickets (id, user_id, ticket_no, subject, body, status) VALUES (?,?,?,?,?, "open")'
        )->execute([$id, $c['sub'], $ref, $b['subject'] ?? 'Chat request', $b['body'] ?? null]);
        Response::json(['ticket_no' => $ref]);
    }

    // =====================================================================
    // Chatbot admin extras
    // =====================================================================
    public function adminChatbotConfigGet(): void
    {
        Auth::requireAdmin();
        Response::json(['config' => self::pdo()->query('SELECT * FROM chatbot_config WHERE id = 1')->fetch() ?: null]);
    }
    public function adminChatbotConfigSave(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        self::pdo()->prepare(
            'INSERT INTO chatbot_config (id, enabled, greeting, human_hours_note, config)
             VALUES (1, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), greeting = VALUES(greeting),
                                    human_hours_note = VALUES(human_hours_note), config = VALUES(config)'
        )->execute([
            (int)($b['enabled'] ?? 1), $b['greeting'] ?? '', $b['human_hours_note'] ?? '',
            json_encode($b),
        ]);
        Response::json(['ok' => true]);
    }
    public function adminChatbotMessagesList(array $p): void
    {
        Auth::requireAdmin();
        $s = self::pdo()->prepare('SELECT * FROM chatbot_messages WHERE conversation_id = ? ORDER BY created_at');
        $s->execute([$p['id']]);
        Response::json(['messages' => $s->fetchAll()]);
    }
    public function adminChatbotReply(array $p): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        self::pdo()->prepare(
            'INSERT INTO chatbot_messages (id, conversation_id, sender, body) VALUES (?,?, "admin", ?)'
        )->execute([Database::uuid(), $p['id'], (string)($b['text'] ?? '')]);
        Response::json(['ok' => true]);
    }
    public function adminChatbotClose(array $p): void
    {
        Auth::requireAdmin();
        self::pdo()->prepare('UPDATE chatbot_conversations SET status = "closed" WHERE id = ?')->execute([$p['id']]);
        Response::json(['ok' => true]);
    }
    public function adminChatbotKbDelete(array $p): void
    {
        Auth::requireAdmin();
        self::pdo()->prepare('DELETE FROM chatbot_kb WHERE id = ?')->execute([$p['id']]);
        Response::json(['ok' => true]);
    }
    public function adminChatbotKbSync(): void
    {
        Auth::requireAdmin();
        // No external KB source configured — return a no-op success shape.
        Response::json(['ok' => true, 'inserted' => 0, 'removed' => 0, 'categories' => new \stdClass()]);
    }
    public function adminChatbotOrderUpsert(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $id = $b['id'] ?? Database::uuid();
        self::pdo()->prepare(
            'INSERT INTO chatbot_orders (id, user_id, payload, status) VALUES (?,?,?,?)
             ON DUPLICATE KEY UPDATE payload = VALUES(payload), status = VALUES(status)'
        )->execute([$id, $b['user_id'] ?? null, json_encode($b['payload'] ?? $b), $b['status'] ?? 'new']);
        Response::json(['id' => $id]);
    }
    public function adminChatbotOrderDelete(array $p): void
    {
        Auth::requireAdmin();
        self::pdo()->prepare('DELETE FROM chatbot_orders WHERE id = ?')->execute([$p['id']]);
        Response::json(['ok' => true]);
    }
    public function adminChatbotTicketUpdate(array $p): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $f = []; $v = [];
        foreach (['status','subject','body'] as $k)
            if (array_key_exists($k, $b)) { $f[] = "$k = ?"; $v[] = $b[$k]; }
        if ($f) { $v[] = $p['id']; self::pdo()->prepare('UPDATE chatbot_tickets SET ' . implode(',', $f) . ' WHERE id = ?')->execute($v); }
        Response::json(['ok' => true]);
    }
    public function adminChatbotTelegramWebhook(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $url = (string)($b['webhookUrl'] ?? '');
        // Set webhook on the first active bot's token.
        $token = self::pdo()->query('SELECT bot_token FROM telegram_bots WHERE is_active = 1 ORDER BY created_at LIMIT 1')->fetchColumn();
        if (!$token || !$url) Response::json(['ok' => false, 'description' => 'No active bot or url']);
        $r = @file_get_contents("https://api.telegram.org/bot$token/setWebhook?url=" . urlencode($url));
        $d = json_decode((string)$r, true) ?: ['ok' => false];
        Response::json($d);
    }

    // =====================================================================
    // Conversion events
    // =====================================================================
    public function conversionEventsPublic(): void
    {
        $s = self::pdo()->query('SELECT * FROM conversion_events WHERE is_active = 1 ORDER BY sort_order');
        Response::json(['events' => $s->fetchAll()]);
    }
    public function adminConversionEventsList(): void
    {
        Auth::requireAdmin();
        Response::json(['events' => self::pdo()->query('SELECT * FROM conversion_events ORDER BY sort_order, created_at')->fetchAll()]);
    }
    public function adminConversionEventUpsert(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $id = $b['id'] ?? Database::uuid();
        self::pdo()->prepare(
            'INSERT INTO conversion_events (id, name, event_type, value_cents, currency, sort_order, is_active, config)
             VALUES (?,?,?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE name=VALUES(name), event_type=VALUES(event_type), value_cents=VALUES(value_cents),
                                    currency=VALUES(currency), sort_order=VALUES(sort_order), is_active=VALUES(is_active),
                                    config=VALUES(config)'
        )->execute([
            $id, $b['name'] ?? '', $b['event_type'] ?? 'lead',
            (int)($b['value_cents'] ?? 0), $b['currency'] ?? 'USD',
            (int)($b['sort_order'] ?? 0), (int)($b['is_active'] ?? 1),
            isset($b['config']) ? json_encode($b['config']) : null,
        ]);
        Response::json(['event' => ['id' => $id]]);
    }
    public function adminConversionEventDelete(array $p): void
    {
        Auth::requireAdmin();
        self::pdo()->prepare('DELETE FROM conversion_events WHERE id = ?')->execute([$p['id']]);
        Response::json(['ok' => true]);
    }

    // =====================================================================
    // Server-side tracking
    // =====================================================================
    public function adminServerTrackingGet(): void
    {
        Auth::requireAdmin();
        Response::json(['config' => self::pdo()->query('SELECT * FROM server_tracking_config WHERE id = 1')->fetch() ?: null]);
    }
    public function adminServerTrackingUpdate(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        self::pdo()->prepare(
            'INSERT INTO server_tracking_config (id, ga4_measurement_id, ga4_api_secret, meta_pixel_id, meta_access_token, tiktok_pixel_id, tiktok_access_token, is_enabled, config)
             VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE ga4_measurement_id=VALUES(ga4_measurement_id), ga4_api_secret=VALUES(ga4_api_secret),
                                    meta_pixel_id=VALUES(meta_pixel_id), meta_access_token=VALUES(meta_access_token),
                                    tiktok_pixel_id=VALUES(tiktok_pixel_id), tiktok_access_token=VALUES(tiktok_access_token),
                                    is_enabled=VALUES(is_enabled), config=VALUES(config)'
        )->execute([
            $b['ga4_measurement_id'] ?? null, $b['ga4_api_secret'] ?? null,
            $b['meta_pixel_id'] ?? null, $b['meta_access_token'] ?? null,
            $b['tiktok_pixel_id'] ?? null, $b['tiktok_access_token'] ?? null,
            (int)($b['is_enabled'] ?? 0), isset($b['config']) ? json_encode($b['config']) : null,
        ]);
        Response::json(['ok' => true]);
    }
    public function adminServerTrackingLog(): void
    {
        Auth::requireAdmin();
        $rows = self::pdo()->query('SELECT * FROM server_event_log ORDER BY created_at DESC LIMIT 200')->fetchAll();
        Response::json(['events' => $rows]);
    }

    // =====================================================================
    // Sample datasets (extended)
    // =====================================================================
    public function samplesData(): void
    {
        $s = self::pdo()->query('SELECT * FROM sample_datasets WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1')->fetch();
        $data = $s && !empty($s['data']) ? json_decode($s['data'], true) : [];
        $meta = $s && !empty($s['meta']) ? json_decode($s['meta'], true) : new \stdClass();
        Response::json(['data' => $data, 'meta' => $meta, 'totalRows' => is_array($data) ? count($data) : 0]);
    }
    public function adminSampleDatasetsList(): void
    {
        Auth::requireAdmin();
        Response::json(['datasets' => self::pdo()->query('SELECT id, source, filename, storage_path, meta, is_active, created_at, updated_at FROM sample_datasets ORDER BY updated_at DESC')->fetchAll()]);
    }
    public function adminSampleDatasetsUpsert(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $id = $b['id'] ?? Database::uuid();
        self::pdo()->prepare(
            'INSERT INTO sample_datasets (id, source, filename, storage_path, data, meta, is_active)
             VALUES (?,?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE source=VALUES(source), filename=VALUES(filename), storage_path=VALUES(storage_path),
                                    data=VALUES(data), meta=VALUES(meta), is_active=VALUES(is_active)'
        )->execute([
            $id, $b['source'] ?? 'apollo', $b['filename'] ?? null, $b['storage_path'] ?? null,
            isset($b['data']) ? json_encode($b['data']) : null,
            isset($b['meta']) ? json_encode($b['meta']) : null,
            (int)($b['is_active'] ?? 1),
        ]);
        self::pdo()->prepare('INSERT INTO sample_dataset_audit (id, dataset_id, action, actor_id) VALUES (?,?, "upsert", ?)')
            ->execute([Database::uuid(), $id, Auth::currentClaims()['sub'] ?? null]);
        Response::json(['id' => $id, 'ok' => true]);
    }
    public function adminSampleDatasetsUpload(): void
    {
        $c = Auth::requireAdmin();
        $b = Request::json();
        $bin = base64_decode((string)($b['contentBase64'] ?? ''), true);
        if ($bin === false) Response::error('Bad base64');
        $filename = (string)($b['filename'] ?? 'upload.bin');
        if (str_contains($filename, '/') || str_contains($filename, '..')) Response::error('Bad filename');
        $dir = rtrim($_ENV['UPLOADS_DIR'] ?? (dirname(__DIR__, 2) . '/uploads'), '/') . '/sample-datasets';
        if (!is_dir($dir)) @mkdir($dir, 0755, true);
        $stored = date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '_' . preg_replace('/[^a-z0-9._-]+/i', '_', $filename);
        file_put_contents("$dir/$stored", $bin);
        Response::json(['ok' => true, 'storage_path' => "sample-datasets/$stored"]);
    }
    public function adminSampleDatasetsAudit(): void
    {
        Auth::requireAdmin();
        Response::json(['entries' => self::pdo()->query('SELECT * FROM sample_dataset_audit ORDER BY created_at DESC LIMIT 200')->fetchAll()]);
    }
    public function adminSampleDatasetsPreview(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $data = $b['data'] ?? [];
        $rows = is_array($data) ? array_slice($data, 0, 25) : [];
        Response::json(['preview' => ['rows' => $rows, 'count' => is_array($data) ? count($data) : 0]]);
    }

    // =====================================================================
    // Backup / Restore
    // =====================================================================
    public function adminBackupExport(): void
    {
        Auth::requireAdmin();
        $pdo = self::pdo();
        $tables = [
            'orders','order_events','order_messages','profiles','user_roles',
            'site_content','site_settings','announcements','social_links',
            'blog_posts','blog_seo_overrides','custom_products','product_details',
            'pricing_settings','store_offers','campaigns','telegram_bots',
            'chatbot_config','chatbot_kb','chatbot_orders','chatbot_tickets',
            'conversion_events','server_tracking_config','sample_datasets',
        ];
        $bundle = ['exported_at' => gmdate('c'), 'tables' => []];
        foreach ($tables as $t) {
            try {
                $bundle['tables'][$t] = $pdo->query("SELECT * FROM $t")->fetchAll();
            } catch (\Throwable) { $bundle['tables'][$t] = []; }
        }
        Response::json(['backup' => $bundle]);
    }
    public function adminBackupRestore(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $backup = $b['backup'] ?? null;
        if (!is_array($backup) || empty($backup['tables'])) Response::error('Invalid backup');
        $counts = [];
        foreach ($backup['tables'] as $table => $rows) {
            if (!preg_match('/^[a-z_]+$/', (string)$table) || !is_array($rows) || !$rows) continue;
            $inserted = 0;
            foreach ($rows as $row) {
                if (!is_array($row) || !$row) continue;
                $cols = array_keys($row);
                if (array_filter($cols, fn($c) => !preg_match('/^[a-z_][a-z0-9_]*$/', $c))) continue;
                $ph = implode(',', array_fill(0, count($cols), '?'));
                $updates = implode(',', array_map(fn($c) => "$c = VALUES($c)", $cols));
                $sql = 'INSERT INTO ' . $table . ' (' . implode(',', $cols) . ") VALUES ($ph) ON DUPLICATE KEY UPDATE $updates";
                try {
                    self::pdo()->prepare($sql)->execute(array_map(fn($v) => is_array($v) ? json_encode($v) : $v, array_values($row)));
                    $inserted++;
                } catch (\Throwable) { /* skip bad row */ }
            }
            $counts[$table] = $inserted;
        }
        Response::json(['ok' => true, 'restored' => $counts]);
    }

    // =====================================================================
    // Data portability
    // =====================================================================
    public function adminPortabilityExport(): void
    {
        Auth::requireAdmin();
        $pdo = self::pdo();
        Response::json([
            'exported_at' => gmdate('c'),
            'profiles'    => $pdo->query('SELECT * FROM profiles')->fetchAll(),
            'orders'      => $pdo->query('SELECT * FROM orders')->fetchAll(),
            'order_events'=> $pdo->query('SELECT * FROM order_events')->fetchAll(),
        ]);
    }
    public function adminPortabilityImport(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $pdo = self::pdo();
        $usersCreated = 0; $clientsProcessed = 0; $ordersUpserted = 0;

        foreach ((array)($b['profiles'] ?? []) as $p) {
            if (empty($p['email'])) continue;
            $clientsProcessed++;
            $email = strtolower((string)$p['email']);
            $exists = $pdo->prepare('SELECT id FROM users WHERE email = ?');
            $exists->execute([$email]);
            $uid = $exists->fetchColumn();
            if (!$uid) {
                $uid = Database::uuid();
                $pdo->prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)')
                    ->execute([$uid, $email, password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT)]);
                $pdo->prepare('INSERT IGNORE INTO profiles (user_id, email, full_name) VALUES (?, ?, ?)')
                    ->execute([$uid, $email, $p['full_name'] ?? null]);
                $usersCreated++;
            }
        }
        foreach ((array)($b['orders'] ?? []) as $o) {
            if (empty($o['id'])) $o['id'] = Database::uuid();
            $cols = array_keys($o);
            $cols = array_values(array_filter($cols, fn($c) => preg_match('/^[a-z_][a-z0-9_]*$/', $c)));
            if (!$cols) continue;
            $ph = implode(',', array_fill(0, count($cols), '?'));
            $up = implode(',', array_map(fn($c) => "$c = VALUES($c)", $cols));
            try {
                $pdo->prepare('INSERT INTO orders (' . implode(',', $cols) . ") VALUES ($ph) ON DUPLICATE KEY UPDATE $up")
                    ->execute(array_map(fn($k) => is_array($o[$k]) ? json_encode($o[$k]) : $o[$k], $cols));
                $ordersUpserted++;
            } catch (\Throwable) {}
        }
        Response::json(['ok' => true, 'users_created' => $usersCreated, 'clients_processed' => $clientsProcessed, 'orders_upserted' => $ordersUpserted]);
    }

    // =====================================================================
    // Drive fetch proxy
    // =====================================================================
    public function adminDriveFetch(): void
    {
        Auth::requireAdmin();
        $url = (string)(Request::json()['url'] ?? '');
        if (!filter_var($url, FILTER_VALIDATE_URL)) Response::error('Invalid url');
        // Normalize common Google Drive share links to a direct download.
        if (preg_match('#drive\.google\.com/file/d/([^/]+)#', $url, $m)) {
            $url = "https://drive.google.com/uc?export=download&id=" . $m[1];
        }
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_USERAGENT => 'EmailslyAdmin/1.0',
        ]);
        $bin = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $ct   = curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: 'application/octet-stream';
        curl_close($ch);
        if ($code >= 400 || $bin === false) Response::error('Fetch failed', 502);
        $fileId = null;
        if (preg_match('#[?&]id=([^&]+)#', $url, $m)) $fileId = $m[1];
        Response::json([
            'fileId'      => $fileId,
            'contentType' => $ct,
            'size'        => strlen((string)$bin),
            'base64'      => base64_encode((string)$bin),
        ]);
    }

    // =====================================================================
    // Stripe admin
    // =====================================================================
    public function adminStripeEvents(): void
    {
        Auth::requireAdmin();
        $limit = max(1, min(500, (int)($_GET['limit'] ?? 100)));
        $type  = $_GET['type'] ?? null;
        $sql = 'SELECT * FROM stripe_events';
        $args = [];
        if ($type) { $sql .= ' WHERE event_type = ?'; $args[] = $type; }
        $sql .= " ORDER BY created_at DESC LIMIT $limit";
        $s = self::pdo()->prepare($sql);
        $s->execute($args);
        Response::json(['events' => $s->fetchAll()]);
    }
    public function adminStripeDeliveries(): void
    {
        Auth::requireAdmin();
        $limit = max(1, min(500, (int)($_GET['limit'] ?? 100)));
        $status = $_GET['status'] ?? null;
        $sql = 'SELECT * FROM stripe_webhook_deliveries';
        $args = [];
        if ($status) { $sql .= ' WHERE status = ?'; $args[] = $status; }
        $sql .= " ORDER BY created_at DESC LIMIT $limit";
        $s = self::pdo()->prepare($sql);
        $s->execute($args);
        Response::json(['deliveries' => $s->fetchAll()]);
    }
}
