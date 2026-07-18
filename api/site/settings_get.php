<?php
declare(strict_types=1);
$row = Db::one('SELECT * FROM site_settings WHERE id = 1');
Response::json(['settings' => $row ?: ['id' => 1]]);
