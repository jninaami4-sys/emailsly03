<?php
namespace Emailsly\Controllers;
use Emailsly\{Auth, Database, Mailer, Request, Response};

final class SupportController
{
    public function listMine(): void
    {
        $c = Auth::requireUser();
        $s = Database::pdo()->prepare('SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC');
        $s->execute([$c['sub']]);
        Response::json(['tickets' => $s->fetchAll()]);
    }
    public function create(): void
    {
        $c = Auth::requireUser();
        $b = Request::json();
        $id = Database::uuid();
        $subject  = trim($b['subject'] ?? '') ?: 'No subject';
        $desc     = $b['description'] ?? null;
        $priority = in_array($b['priority'] ?? 'normal', ['low','normal','high','urgent'], true) ? $b['priority'] : 'normal';
        Database::pdo()->prepare(
            'INSERT INTO support_tickets (id,user_id,subject,description,category,priority,status,last_message_at)
             VALUES (?,?,?,?,?,?, "open", NOW())'
        )->execute([
            $id, $c['sub'], $subject, $desc, $b['category'] ?? null, $priority,
        ]);
        $this->notifyTicketCreated($id, $subject, $desc, $priority, $c['email'] ?? null);
        Response::json(['id' => $id]);
    }
    public function show(array $p): void
    {
        $c = Auth::requireUser();
        $s = Database::pdo()->prepare('SELECT * FROM support_tickets WHERE id = ?');
        $s->execute([$p['id']]);
        $t = $s->fetch();
        if (!$t) Response::notFound('Ticket');
        $isAdmin = in_array('admin', $c['roles'] ?? [], true);
        if ($t['user_id'] !== $c['sub'] && !$isAdmin) Response::forbidden();
        $m = Database::pdo()->prepare('SELECT * FROM support_ticket_messages WHERE ticket_id = ? ORDER BY created_at');
        $m->execute([$p['id']]);
        Response::json(['ticket' => $t, 'messages' => $m->fetchAll()]);
    }
    public function postMessage(array $p): void
    {
        $c = Auth::requireUser();
        $b = Request::json();
        $body = trim($b['body'] ?? '');
        if (!$body) Response::error('Message body required');
        $s = Database::pdo()->prepare('SELECT user_id FROM support_tickets WHERE id = ?');
        $s->execute([$p['id']]);
        $owner = $s->fetchColumn();
        if (!$owner) Response::notFound('Ticket');
        $isAdmin = in_array('admin', $c['roles'] ?? [], true);
        if ($owner !== $c['sub'] && !$isAdmin) Response::forbidden();
        Database::pdo()->prepare(
            'INSERT INTO support_ticket_messages (id,ticket_id,sender_id,sender_role,body) VALUES (?,?,?,?,?)'
        )->execute([Database::uuid(), $p['id'], $c['sub'], $isAdmin ? 'admin' : 'customer', $body]);
        // Update ticket
        Database::pdo()->prepare(
            'UPDATE support_tickets SET last_message_at = NOW(),
             status = CASE
               WHEN ? = "customer" AND status IN ("waiting_customer","resolved","closed") THEN "open"
               WHEN ? = "admin" AND status = "open" THEN "in_progress"
               ELSE status END
             WHERE id = ?'
        )->execute([$isAdmin ? 'admin' : 'customer', $isAdmin ? 'admin' : 'customer', $p['id']]);
        $this->notifyTicketReply($p['id'], $body, $isAdmin);
        Response::json(['ok' => true]);
    }

    private function notifyTicketCreated(string $id, string $subject, ?string $desc, string $priority, ?string $userEmail): void
    {
        $ref  = substr($id, 0, 8);
        $app  = $_ENV['APP_URL'] ?? '';
        $mailer = Mailer::support();
        if ($userEmail) {
            $body = "Hi,\n\nWe've received your support request and our team will get back to you shortly.\n\n"
                  . "Ticket: #$ref\nSubject: $subject\nPriority: $priority\n\n"
                  . ($app ? "Track it here: $app/support/$id\n\n" : '')
                  . "Reply to this email and we'll add it to the ticket.\n\n— Emailsly Support";
            $mailer->send($userEmail, "Support ticket received · #$ref", $body);
        }
        $inbox = $_ENV['SUPPORT_ADMIN_INBOX'] ?? ($_ENV['ADMIN_EMAIL'] ?? null);
        if ($inbox) {
            $mailer->send(
                $inbox,
                "[Ticket] #$ref · $priority · $subject",
                "New support ticket opened.\n\nRef: #$ref\nFrom: " . ($userEmail ?: 'unknown')
                . "\nPriority: $priority\nSubject: $subject\n\n" . ($desc ?: '(no description)')
                . ($app ? "\n\nOpen: $app/admin/support/$id" : ''),
                false,
                $userEmail ?: null
            );
        }
    }

    private function notifyTicketReply(string $ticketId, string $body, bool $isAdmin): void
    {
        $s = Database::pdo()->prepare(
            'SELECT t.subject, t.user_id, u.email FROM support_tickets t
             LEFT JOIN users u ON u.id = t.user_id WHERE t.id = ?'
        );
        $s->execute([$ticketId]);
        $row = $s->fetch();
        if (!$row) return;
        $ref = substr($ticketId, 0, 8);
        $app = $_ENV['APP_URL'] ?? '';
        $mailer = Mailer::support();
        if ($isAdmin && !empty($row['email'])) {
            // Notify customer of admin reply
            $mailer->send(
                $row['email'],
                "New reply on ticket #$ref",
                "Hi,\n\nOur support team replied to your ticket \"{$row['subject']}\":\n\n$body\n\n"
                . ($app ? "View the full thread: $app/support/$ticketId\n\n" : '')
                . "— Emailsly Support"
            );
        } elseif (!$isAdmin) {
            // Notify admins of customer reply
            $inbox = $_ENV['SUPPORT_ADMIN_INBOX'] ?? ($_ENV['ADMIN_EMAIL'] ?? null);
            if ($inbox) {
                $mailer->send(
                    $inbox,
                    "[Ticket reply] #$ref · {$row['subject']}",
                    "Customer replied on ticket #$ref (" . ($row['email'] ?: 'unknown') . "):\n\n$body"
                    . ($app ? "\n\nOpen: $app/admin/support/$ticketId" : ''),
                    false,
                    $row['email'] ?: null
                );
            }
        }
    }
}
