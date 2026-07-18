<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

// Strip /api prefix from the request path
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (str_starts_with($path, '/api/')) $path = substr($path, 4);
elseif ($path === '/api')            $path = '/';
$path = '/' . trim($path, '/');

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

// Simple router table — extend as PHP controllers are added.
$routes = [
    // Health
    ['GET',    '#^/health$#',                       'health.php'],

    // Auth
    ['POST',   '#^/auth/register$#',                'auth/register.php'],
    ['POST',   '#^/auth/login$#',                   'auth/login.php'],
    ['POST',   '#^/auth/logout$#',                  'auth/logout.php'],
    ['GET',    '#^/auth/me$#',                      'auth/me.php'],
    ['PATCH',  '#^/auth/me$#',                      'auth/update_me.php'],
    ['POST',   '#^/auth/refresh$#',                 'auth/refresh.php'],
    ['POST',   '#^/auth/otp/verify$#',              'auth/otp_verify.php'],
    ['POST',   '#^/auth/otp/resend$#',              'auth/otp_resend.php'],
    ['POST',   '#^/auth/password/forgot$#',         'auth/password_forgot.php'],
    ['POST',   '#^/auth/password/reset$#',          'auth/password_reset.php'],

    // Site
    ['GET',    '#^/site-settings$#',                'site/settings_get.php'],
    ['PATCH',  '#^/admin/site-settings$#',          'admin/site_settings_update.php'],

    // Uploads
    ['POST',   '#^/uploads$#',                      'uploads/upload.php'],
    ['POST',   '#^/uploads/sign$#',                 'uploads/sign.php'],
    ['DELETE', '#^/uploads$#',                      'uploads/destroy.php'],
];

foreach ($routes as [$m, $re, $file]) {
    if ($m !== $method) continue;
    if (!preg_match($re, $path, $vars)) continue;
    $full = __DIR__ . '/' . $file;
    if (!is_file($full)) Response::error("Handler not implemented: $file", 501);
    $ROUTE_VARS = $vars;
    require $full;
    exit;
}

Response::error("Not found: $method $path", 404);
