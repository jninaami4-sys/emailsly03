<?php
declare(strict_types=1);

$dbOk = false; $dbErr = null;
try { Db::conn()->query('SELECT 1'); $dbOk = true; }
catch (\Throwable $e) { $dbErr = $e->getMessage(); }

Response::json([
    'ok'   => $dbOk,
    'time' => gmdate('c'),
    'db'   => ['ok' => $dbOk, 'error' => $dbErr],
    'env'  => APP_ENV,
]);
