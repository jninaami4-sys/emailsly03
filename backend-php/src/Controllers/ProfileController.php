<?php
namespace Emailsly\Controllers;

use Emailsly\{Auth, Database, Request, Response};

final class ProfileController
{
    public function me(): void
    {
        $c = Auth::requireUser();
        $s = Database::pdo()->prepare('SELECT * FROM profiles WHERE user_id = ?');
        $s->execute([$c['sub']]);
        Response::json(['profile' => $s->fetch() ?: null]);
    }
    public function update(): void
    {
        $c = Auth::requireUser();
        $b = Request::json();
        $fields = []; $vals = [];
        foreach (['full_name','avatar_url','company','phone','bio'] as $k) {
            if (array_key_exists($k, $b)) { $fields[] = "$k = ?"; $vals[] = $b[$k]; }
        }
        if ($fields) {
            $vals[] = $c['sub'];
            Database::pdo()->prepare('UPDATE profiles SET ' . implode(',', $fields) . ' WHERE user_id = ?')->execute($vals);
        }
        $this->me();
    }
}
