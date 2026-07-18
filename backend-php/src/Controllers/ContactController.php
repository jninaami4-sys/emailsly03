<?php
namespace Emailsly\Controllers;
use Emailsly\{Database, Mailer, Request, Response};

final class ContactController
{
    public function submit(): void
    {
        $b = Request::json();
        $id = Database::uuid();
        Database::pdo()->prepare(
            'INSERT INTO contact_leads (id,name,email,phone,company,subject,message,source,ip_address,user_agent)
             VALUES (?,?,?,?,?,?,?,?,?,?)'
        )->execute([
            $id,
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
        $this->notifyContact($id, $b);
        Response::json(['ok' => true]);
    }

    private function notifyContact(string $id, array $b): void
    {
        $mailer  = Mailer::contact();
        $name    = trim($b['name'] ?? '') ?: 'there';
        $email   = $b['email'] ?? null;
        $subject = trim($b['subject'] ?? '') ?: 'Your message to Emailsly';
        $msg     = $b['message'] ?? '';

        // Auto-reply to the visitor
        if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $mailer->send(
                $email,
                "We got your message — Emailsly",
                "Hi $name,\n\nThanks for reaching out to Emailsly. We've received your message and someone from our team will reply within one business day.\n\n"
                . "For reference, this is what you sent us:\n\nSubject: $subject\n\n$msg\n\n— The Emailsly Team"
            );
        }

        // Internal copy
        $inbox = $_ENV['CONTACT_ADMIN_INBOX'] ?? ($_ENV['ADMIN_EMAIL'] ?? null);
        if ($inbox) {
            $mailer->send(
                $inbox,
                "[Contact] $subject — " . ($name ?: 'unknown'),
                "New contact form submission.\n\n"
                . "Name: $name\nEmail: " . ($email ?: 'n/a') . "\nCompany: " . ($b['company'] ?? 'n/a')
                . "\nPhone: " . ($b['phone'] ?? 'n/a') . "\nSource: " . ($b['source'] ?? 'contact_form')
                . "\n\nSubject: $subject\n\n$msg",
                false,
                $email ?: null
            );
        }
    }
}
