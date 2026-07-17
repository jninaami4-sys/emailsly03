<?php
namespace Emailsly\Controllers\Admin;
use Emailsly\{Auth, Database, Response};
final class AnalyticsAdmin {
  public function overview(): void {
    Auth::requireAdmin();
    $pdo = Database::pdo();
    $out = [
      'orders_total'         => (int)$pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn(),
      'orders_paid'          => (int)$pdo->query('SELECT COUNT(*) FROM orders WHERE payment_status="paid"')->fetchColumn(),
      'orders_cancelled'     => (int)$pdo->query('SELECT COUNT(*) FROM orders WHERE status="cancelled"')->fetchColumn(),
      'revenue_cents'        => (int)$pdo->query('SELECT COALESCE(SUM(total_cents),0) FROM orders WHERE payment_status="paid"')->fetchColumn(),
      'users_total'          => (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn(),
      'users_new_7d'         => (int)$pdo->query('SELECT COUNT(*) FROM users WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)')->fetchColumn(),
      'leads_new_7d'         => (int)$pdo->query('SELECT COUNT(*) FROM contact_leads WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)')->fetchColumn(),
      'tickets_open'         => (int)$pdo->query('SELECT COUNT(*) FROM support_tickets WHERE status IN ("open","in_progress")')->fetchColumn(),
      'reviews_pending'      => (int)$pdo->query('SELECT COUNT(*) FROM reviews WHERE status="pending"')->fetchColumn(),
      'blog_views_30d'       => (int)$pdo->query('SELECT COUNT(*) FROM blog_analytics_events WHERE event_type="view" AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)')->fetchColumn(),
      'chatbot_convos_open'  => (int)$pdo->query('SELECT COUNT(*) FROM chatbot_conversations WHERE status="active"')->fetchColumn(),
    ];
    Response::json($out);
  }
}
