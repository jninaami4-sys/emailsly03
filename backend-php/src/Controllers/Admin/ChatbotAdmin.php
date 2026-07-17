<?php
namespace Emailsly\Controllers\Admin;
use Emailsly\{Auth, Database, Request, Response};
final class ChatbotAdmin {
  public function listConversations(): void {
    Auth::requireAdmin();
    Response::json(['rows' => Database::pdo()->query('SELECT * FROM chatbot_conversations ORDER BY updated_at DESC LIMIT 500')->fetchAll()]);
  }
  public function listOrders(): void {
    Auth::requireAdmin();
    Response::json(['rows' => Database::pdo()->query('SELECT * FROM chatbot_orders ORDER BY created_at DESC LIMIT 500')->fetchAll()]);
  }
  public function listTickets(): void {
    Auth::requireAdmin();
    Response::json(['rows' => Database::pdo()->query('SELECT * FROM chatbot_tickets ORDER BY created_at DESC LIMIT 500')->fetchAll()]);
  }
  public function listKb(): void {
    Auth::requireAdmin();
    Response::json(['rows' => Database::pdo()->query('SELECT * FROM chatbot_kb ORDER BY updated_at DESC')->fetchAll()]);
  }
  public function upsertKb(): void {
    Auth::requireAdmin();
    $b = Request::json();
    $id = $b['id'] ?? Database::uuid();
    Database::pdo()->prepare(
      'INSERT INTO chatbot_kb (id,title,body,tags,category,is_active,language) VALUES (?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE title=VALUES(title), body=VALUES(body), tags=VALUES(tags), category=VALUES(category), is_active=VALUES(is_active), language=VALUES(language)'
    )->execute([
      $id, $b['title'] ?? '', $b['body'] ?? null,
      isset($b['tags']) ? json_encode($b['tags']) : null,
      $b['category'] ?? null, (int)($b['is_active'] ?? 1), $b['language'] ?? 'en',
    ]);
    Response::json(['id' => $id]);
  }
}
