<?php
namespace Emailsly\Controllers\Admin;
use Emailsly\{Auth, Database, Request, Response};
final class UsersAdmin {
  public function index(): void {
    Auth::requireAdmin();
    $s = Database::pdo()->query(
      'SELECT u.id, u.email, u.created_at, u.last_login_at,
              p.full_name, p.avatar_url, p.company,
              (SELECT GROUP_CONCAT(role) FROM user_roles WHERE user_id = u.id) AS roles
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id
       ORDER BY u.created_at DESC LIMIT 500');
    Response::json(['users' => $s->fetchAll()]);
  }
  public function setRoles(array $p): void {
    Auth::requireAdmin();
    $b = Request::json();
    $roles = array_values(array_intersect($b['roles'] ?? [], ['admin','moderator','user']));
    $pdo = Database::pdo();
    $pdo->prepare('DELETE FROM user_roles WHERE user_id = ?')->execute([$p['id']]);
    $ins = $pdo->prepare('INSERT INTO user_roles (id,user_id,role) VALUES (?,?,?)');
    foreach ($roles as $r) $ins->execute([Database::uuid(), $p['id'], $r]);
    Response::json(['ok' => true, 'roles' => $roles]);
  }
}
