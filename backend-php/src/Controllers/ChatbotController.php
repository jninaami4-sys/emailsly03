<?php
namespace Emailsly\Controllers;
use Emailsly\{Database, Request, Response};

final class ChatbotController
{
    public function startConversation(): void
    {
        $b = Request::json();
        $id = Database::uuid();
        $tok = bin2hex(random_bytes(32));
        Database::pdo()->prepare(
            'INSERT INTO chatbot_conversations (id,session_token,visitor_name,visitor_email) VALUES (?,?,?,?)'
        )->execute([$id, $tok, $b['name'] ?? null, $b['email'] ?? null]);
        Response::json(['conversation_id' => $id, 'session_token' => $tok]);
    }
    public function sendMessage(): void
    {
        $b = Request::json();
        $tok = $b['session_token'] ?? '';
        $s = Database::pdo()->prepare('SELECT id FROM chatbot_conversations WHERE session_token = ?');
        $s->execute([$tok]);
        $cid = $s->fetchColumn();
        if (!$cid) Response::unauthorized('Invalid session');
        Database::pdo()->prepare(
            'INSERT INTO chatbot_messages (id,conversation_id,sender,body) VALUES (?,?,?,?)'
        )->execute([Database::uuid(), $cid, $b['sender'] ?? 'user', $b['body'] ?? '']);
        Response::json(['ok' => true]);
    }
    public function showConversation(array $p): void
    {
        $tok = Request::query('session_token', '');
        $s = Database::pdo()->prepare('SELECT id FROM chatbot_conversations WHERE id = ? AND session_token = ?');
        $s->execute([$p['id'], $tok]);
        if (!$s->fetchColumn()) Response::unauthorized();
        $m = Database::pdo()->prepare('SELECT * FROM chatbot_messages WHERE conversation_id = ? ORDER BY created_at');
        $m->execute([$p['id']]);
        Response::json(['messages' => $m->fetchAll()]);
    }
}
