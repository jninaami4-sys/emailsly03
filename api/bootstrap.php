<?php
declare(strict_types=1);

// Load config
$config = require __DIR__ . '/config.local.php';
if (!is_array($config)) {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid config.local.php']);
    exit;
}
foreach ($config as $k => $v) {
    if (!defined($k)) define($k, $v);
}

date_default_timezone_set('UTC');
error_reporting(E_ALL);
ini_set('display_errors', APP_DEBUG ? '1' : '0');
ini_set('log_errors', '1');

// Autoload lib/*.php
spl_autoload_register(function (string $class): void {
    $file = __DIR__ . '/lib/' . $class . '.php';
    if (is_file($file)) require_once $file;
});

// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin) {
    $allowed = in_array('*', CORS_ORIGINS, true) || in_array($origin, CORS_ORIGINS, true);
    if ($allowed) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }
}
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Global exception handler → JSON
set_exception_handler(function (\Throwable $e): void {
    error_log('[api] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json');
    }
    echo json_encode([
        'error'   => APP_DEBUG ? $e->getMessage() : 'Server error',
        'trace'   => APP_DEBUG ? $e->getTraceAsString() : null,
    ]);
});
