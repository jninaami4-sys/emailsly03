<?php
namespace Emailsly\Controllers;
use Emailsly\{Database, Request, Response};

final class ContactController
{
    public function submit(): void
    {
        $b = Request::json();
        Database::pdo()->prepare(
            'INSERT INTO contact_leads (id,name,email,phone,company,subject,message,source,ip_address,user_agent)
             VALUES (?,?,?,?,?,?,?,?,?,?)'
        )->execute([
            Database::uuid(),
            $b['name'] ?? null,
            $b['email'] ?? null,
            $b['phone'] ?? null,
            $b['company'] ?? null,
            $b['subject'] ?? null,
            $b['message'] ?? null,
            $b['source'] ?? 'contact_form',
            Request::ip(),
            substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
        ]);
        Response::json(['ok' => true]);
    }
}
