<?php
declare(strict_types=1);
Auth::requireAdmin();
$body = Response::jsonBody();
$allowed = ['brand_name','logo_url','favicon_url','invoice_logo_url','footer_logo_url','primary_color','contact_email','meta'];
$patch = [];
foreach ($allowed as $f) if (array_key_exists($f, $body)) $patch[$f] = $body[$f];
if (!$patch) Response::json(['settings' => Db::one('SELECT * FROM site_settings WHERE id = 1')]);
$exists = Db::one('SELECT id FROM site_settings WHERE id = 1');
if ($exists) Db::update('site_settings', $patch, ['id' => 1]);
else         Db::insert('site_settings', array_merge(['id' => 1], $patch));
Response::json(['settings' => Db::one('SELECT * FROM site_settings WHERE id = 1')]);
