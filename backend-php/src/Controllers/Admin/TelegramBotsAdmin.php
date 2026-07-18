<?php
namespace Emailsly\Controllers\Admin;
use Emailsly\{Auth, Database, Request, Response};

final class TelegramBotsAdmin
{
    private const F = ['name','bot_token','chat_id','purpose','is_active'];

    public function index(): void
    {
        Auth::requireAdmin();
        Response::json(['bots' => Database::pdo()->query('SELECT id, name, chat_id, purpose, is_active, created_at, updated_at FROM telegram_bots ORDER BY created_at DESC')->fetchAll()]);
    }
    public function create(): void
    {
        Auth::requireAdmin();
        $b = Request::json(); $id = Database::uuid();
        $cols = ['id']; $ph = ['?']; $vals = [$id];
        foreach (self::F as $k) if (array_key_exists($k, $b)) { $cols[] = $k; $ph[] = '?'; $vals[] = $b[$k]; }
        Database::pdo()->prepare('INSERT INTO telegram_bots (' . implode(',', $cols) . ') VALUES (' . implode(',', $ph) . ')')->execute($vals);
        Response::json(['id' => $id]);
    }
    public function update(array $p): void
    {
        Auth::requireAdmin();
        $b = Request::json(); $set = []; $vals = [];
        foreach (self::F as $k) if (array_key_exists($k, $b)) { $set[] = "$k = ?"; $vals[] = $b[$k]; }
        if (!$set) Response::error('Nothing to update');
        $vals[] = $p['id'];
        Database::pdo()->prepare('UPDATE telegram_bots SET ' . implode(',', $set) . ' WHERE id = ?')->execute($vals);
        Response::json(['ok' => true]);
    }
    public function destroy(array $p): void
    {
        Auth::requireAdmin();
        Database::pdo()->prepare('DELETE FROM telegram_bots WHERE id = ?')->execute([$p['id']]);
        Response::json(['ok' => true]);
    }
    /** Test-send: POST {id, text} → uses stored bot_token+chat_id to hit Telegram API */
    public function test(): void
    {
        Auth::requireAdmin();
        $b = Request::json();
        $s = Database::pdo()->prepare('SELECT bot_token, chat_id FROM telegram_bots WHERE id = ?');
        $s->execute([$b['id'] ?? '']);
        $row = $s->fetch();
        if (!$row) Response::notFound();
        $url = 'https://api.telegram.org/bot' . $row['bot_token'] . '/sendMessage';
        $body = http_build_query(['chat_id' => $row['chat_id'], 'text' => (string)($b['text'] ?? 'Test from Emailsly admin')]);
        $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => 'Content-Type: application/x-www-form-urlencoded', 'content' => $body, 'timeout' => 10]]);
        $resp = @file_get_contents($url, false, $ctx);
        Response::json(['sent' => $resp !== false, 'raw' => $resp]);
    }
}
