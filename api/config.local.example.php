<?php
// ============================================================================
// Copy to config.local.php on your server and fill in real values.
// DO NOT commit config.local.php.
// ============================================================================
return [
    // MySQL
    'DB_HOST'            => 'localhost',
    'DB_PORT'            => 3306,
    'DB_NAME'            => 'emailsly',
    'DB_USER'            => 'emailsly_user',
    'DB_PASS'            => 'change-me',
    'DB_CHARSET'         => 'utf8mb4',

    // JWT signing key — 32+ random bytes. Generate: openssl rand -hex 32
    'JWT_SECRET'         => 'change-me-to-a-64-char-hex-string',
    'JWT_ISSUER'         => 'emailsly',
    'JWT_TTL_SECONDS'    => 60 * 60 * 24 * 7, // 7 days

    // Public URLs
    'PUBLIC_URL'         => 'https://api.yourdomain.com',   // where /api/uploads/... is served from
    'FRONTEND_URL'       => 'https://yourdomain.com',       // for password-reset links, etc.
    'UPLOAD_DIR'         => __DIR__ . '/uploads',           // filesystem path

    // CORS — allow your frontend origin(s). Use ['*'] to allow all.
    'CORS_ORIGINS'       => ['https://yourdomain.com'],

    // SMTP (for OTP + reset emails). Leave SMTP_HOST empty to log codes to /api/logs/mail.log instead.
    'SMTP_HOST'          => '',
    'SMTP_PORT'          => 587,
    'SMTP_USER'          => '',
    'SMTP_PASS'          => '',
    'SMTP_FROM'          => 'no-reply@yourdomain.com',
    'SMTP_FROM_NAME'     => 'Emailsly',
    'SMTP_SECURE'        => 'tls', // '', 'tls', or 'ssl'

    // Stripe (server-only)
    'STRIPE_SECRET_KEY'    => '',
    'STRIPE_WEBHOOK_SECRET'=> '',
    'STRIPE_SUCCESS_URL'   => 'https://yourdomain.com/checkout/success',
    'STRIPE_CANCEL_URL'    => 'https://yourdomain.com/checkout/cancel',

    // Environment
    'APP_ENV'            => 'production',   // 'production' or 'development'
    'APP_DEBUG'          => false,
];
