<?php
namespace Emailsly\Controllers;
use Emailsly\{Auth, Database, Request, Response};

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
        Database::pdo()->prepare(
            'INSERT INTO support_tickets (id,user_id,subject,description,category,priority,status,last_message_at)
             VALUES (?,?,?,?,?,?, "open", NOW())'
        )->execute([
            $id, $c['sub'],
            trim($b['subject'] ?? '') ?: 'No subject',
            $b['description'] ?? null,
            $b['category'] ?? null,
            in_array($b['priority'] ?? 'normal', ['low','normal','high','urgent'], true) ? $b['priority'] : 'normal',
        ]);
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
        Response::json(['ok' => true]);
    }
}
