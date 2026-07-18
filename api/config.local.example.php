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

    // SMTP. Leave SMTP_HOST empty to log codes to /api/logs/mail.log instead.
    // Point your MX / SMTP relay at the `mail.emailsly.com` subdomain and create
    // the two mailboxes below. SMTP_FROM is the generic fallback; auth codes and
    // order emails use their dedicated From address so deliverability is isolated.
    'SMTP_HOST'          => '',                               // e.g. smtp.mail.emailsly.com
    'SMTP_PORT'          => 587,
    'SMTP_USER'          => '',                               // usually the full mailbox address
    'SMTP_PASS'          => '',                               // add on the server, never commit
    'SMTP_FROM'          => 'noreply@mail.emailsly.com',      // generic fallback
    'SMTP_FROM_AUTH'     => 'noreply@mail.emailsly.com',      // OTP codes, verification, password reset
    'SMTP_FROM_ORDERS'   => 'orders@mail.emailsly.com',       // order confirmation, invoice, status updates
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
