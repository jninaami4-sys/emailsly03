<?php
declare(strict_types=1);

/**
 * Emailsly API — single front controller.
 * All /api/* requests route through here.
 */

// Load .env
$envPath = dirname(__DIR__) . '/.env';
if (file_exists($envPath)) {
    foreach (parse_ini_file($envPath) as $k => $v) {
        $_ENV[$k] = $v;
        putenv("$k=$v");
    }
}

require dirname(__DIR__) . '/vendor/autoload.php';

use Emailsly\Router;
use Emailsly\Response;

// --- CORS ---
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = array_map('trim', explode(',', $_ENV['CORS_ORIGINS'] ?? ''));
if (in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 86400');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// --- Router ---
$router = new Router();

// Health
$router->get('/api/health', fn() => Response::json(['ok' => true, 'ts' => date('c')]));

// Auth
$router->post('/api/auth/register',       ['Emailsly\Controllers\AuthController', 'register']);
$router->post('/api/auth/login',          ['Emailsly\Controllers\AuthController', 'login']);
$router->post('/api/auth/logout',         ['Emailsly\Controllers\AuthController', 'logout']);
$router->post('/api/auth/refresh',        ['Emailsly\Controllers\AuthController', 'refresh']);
$router->get ('/api/auth/me',             ['Emailsly\Controllers\AuthController', 'me']);
$router->post('/api/auth/password/forgot',['Emailsly\Controllers\AuthController', 'forgotPassword']);
$router->post('/api/auth/password/reset', ['Emailsly\Controllers\AuthController', 'resetPassword']);
$router->patch('/api/auth/me',            ['Emailsly\Controllers\AuthController', 'updateMe']);

// Profiles
$router->get ('/api/profiles/me',         ['Emailsly\Controllers\ProfileController', 'me']);
$router->patch('/api/profiles/me',        ['Emailsly\Controllers\ProfileController', 'update']);

// Orders
$router->get ('/api/orders',              ['Emailsly\Controllers\OrderController', 'listMine']);
$router->post('/api/orders',              ['Emailsly\Controllers\OrderController', 'create']);
$router->post('/api/orders/track',        ['Emailsly\Controllers\OrderController', 'track']);
$router->get ('/api/orders/{id}',         ['Emailsly\Controllers\OrderController', 'show']);
$router->post('/api/orders/{id}/messages',['Emailsly\Controllers\OrderController', 'postMessage']);

// Pricing (public)
$router->get ('/api/pricing',             ['Emailsly\Controllers\PricingController', 'listPublic']);

// Blog (public)
$router->get ('/api/blog/posts',          ['Emailsly\Controllers\BlogController', 'listPublic']);
$router->get ('/api/blog/posts/{slug}',   ['Emailsly\Controllers\BlogController', 'showBySlug']);
$router->post('/api/blog/track',          ['Emailsly\Controllers\BlogController', 'trackEvent']);

// Site content (public)
$router->get ('/api/site/content',        ['Emailsly\Controllers\SiteController', 'content']);
$router->get ('/api/site/settings',       ['Emailsly\Controllers\SiteController', 'settings']);
$router->get ('/api/site/announcements',  ['Emailsly\Controllers\SiteController', 'announcements']);
$router->get ('/api/site/social-links',   ['Emailsly\Controllers\SiteController', 'socialLinks']);

// Reviews (public list, auth create)
$router->get ('/api/reviews',             ['Emailsly\Controllers\ReviewController', 'listPublic']);
$router->post('/api/reviews',             ['Emailsly\Controllers\ReviewController', 'create']);

// Contact leads
$router->post('/api/contact',             ['Emailsly\Controllers\ContactController', 'submit']);

// Support tickets
$router->get ('/api/support/tickets',     ['Emailsly\Controllers\SupportController', 'listMine']);
$router->post('/api/support/tickets',     ['Emailsly\Controllers\SupportController', 'create']);
$router->get ('/api/support/tickets/{id}',['Emailsly\Controllers\SupportController', 'show']);
$router->post('/api/support/tickets/{id}/messages', ['Emailsly\Controllers\SupportController', 'postMessage']);

// Referrals
$router->get ('/api/referrals/me',        ['Emailsly\Controllers\ReferralController', 'me']);
$router->post('/api/referrals/redeem',    ['Emailsly\Controllers\ReferralController', 'redeem']);
$router->post('/api/referrals/click',     ['Emailsly\Controllers\ReferralController', 'trackClick']);

// Chatbot
$router->post('/api/chatbot/conversations',      ['Emailsly\Controllers\ChatbotController', 'startConversation']);
$router->post('/api/chatbot/messages',           ['Emailsly\Controllers\ChatbotController', 'sendMessage']);
$router->get ('/api/chatbot/conversations/{id}', ['Emailsly\Controllers\ChatbotController', 'showConversation']);

// Sample datasets
$router->get ('/api/samples',             ['Emailsly\Controllers\SampleController', 'listPublic']);
$router->get ('/api/samples/{slug}',      ['Emailsly\Controllers\SampleController', 'download']);

// Stripe
$router->post('/api/stripe/checkout',     ['Emailsly\Controllers\StripeController', 'createCheckout']);
$router->post('/api/stripe/webhook',      ['Emailsly\Controllers\StripeController', 'webhook']);

// Files (upload + serve)
$router->post('/api/files/upload',        ['Emailsly\Controllers\FileController', 'upload']);
$router->get ('/api/files/{bucket}/{name}', ['Emailsly\Controllers\FileController', 'serve']);

// --- Admin routes (all require role=admin) ---
$router->get   ('/api/admin/orders',                ['Emailsly\Controllers\Admin\OrdersAdmin', 'index']);
$router->post  ('/api/admin/orders',                ['Emailsly\Controllers\Admin\OrdersAdmin', 'create']);
$router->patch ('/api/admin/orders/{id}',           ['Emailsly\Controllers\Admin\OrdersAdmin', 'update']);
$router->delete('/api/admin/orders/{id}',           ['Emailsly\Controllers\Admin\OrdersAdmin', 'destroy']);

$router->get   ('/api/admin/pricing',               ['Emailsly\Controllers\Admin\PricingAdmin', 'index']);
$router->patch ('/api/admin/pricing/{id}',          ['Emailsly\Controllers\Admin\PricingAdmin', 'update']);

$router->get   ('/api/admin/blog/posts',            ['Emailsly\Controllers\Admin\BlogAdmin', 'index']);
$router->post  ('/api/admin/blog/posts',            ['Emailsly\Controllers\Admin\BlogAdmin', 'create']);
$router->patch ('/api/admin/blog/posts/{id}',       ['Emailsly\Controllers\Admin\BlogAdmin', 'update']);
$router->delete('/api/admin/blog/posts/{id}',       ['Emailsly\Controllers\Admin\BlogAdmin', 'destroy']);
$router->get   ('/api/admin/blog/seo/{postId}',     ['Emailsly\Controllers\Admin\BlogAdmin', 'showSeo']);
$router->put   ('/api/admin/blog/seo/{postId}',     ['Emailsly\Controllers\Admin\BlogAdmin', 'upsertSeo']);
$router->get   ('/api/admin/blog/analytics',        ['Emailsly\Controllers\Admin\BlogAdmin', 'analytics']);

$router->get   ('/api/admin/announcements',         ['Emailsly\Controllers\Admin\AnnouncementsAdmin', 'index']);
$router->post  ('/api/admin/announcements',         ['Emailsly\Controllers\Admin\AnnouncementsAdmin', 'create']);
$router->patch ('/api/admin/announcements/{id}',    ['Emailsly\Controllers\Admin\AnnouncementsAdmin', 'update']);
$router->delete('/api/admin/announcements/{id}',    ['Emailsly\Controllers\Admin\AnnouncementsAdmin', 'destroy']);

$router->get   ('/api/admin/reviews',               ['Emailsly\Controllers\Admin\ReviewsAdmin', 'index']);
$router->patch ('/api/admin/reviews/{id}',          ['Emailsly\Controllers\Admin\ReviewsAdmin', 'update']);
$router->delete('/api/admin/reviews/{id}',          ['Emailsly\Controllers\Admin\ReviewsAdmin', 'destroy']);

$router->get   ('/api/admin/tickets',               ['Emailsly\Controllers\Admin\TicketsAdmin', 'index']);
$router->patch ('/api/admin/tickets/{id}',          ['Emailsly\Controllers\Admin\TicketsAdmin', 'update']);

$router->get   ('/api/admin/leads',                 ['Emailsly\Controllers\Admin\LeadsAdmin', 'index']);
$router->patch ('/api/admin/leads/{id}',            ['Emailsly\Controllers\Admin\LeadsAdmin', 'update']);

$router->get   ('/api/admin/referrals',             ['Emailsly\Controllers\Admin\ReferralsAdmin', 'index']);
$router->patch ('/api/admin/referrals/{id}',        ['Emailsly\Controllers\Admin\ReferralsAdmin', 'update']);

$router->get   ('/api/admin/users',                 ['Emailsly\Controllers\Admin\UsersAdmin', 'index']);
$router->patch ('/api/admin/users/{id}/roles',      ['Emailsly\Controllers\Admin\UsersAdmin', 'setRoles']);

$router->get   ('/api/admin/site/content',          ['Emailsly\Controllers\Admin\SiteAdmin', 'listContent']);
$router->put   ('/api/admin/site/content/{key}',    ['Emailsly\Controllers\Admin\SiteAdmin', 'upsertContent']);
$router->get   ('/api/admin/site/settings',         ['Emailsly\Controllers\Admin\SiteAdmin', 'settings']);
$router->put   ('/api/admin/site/settings',         ['Emailsly\Controllers\Admin\SiteAdmin', 'updateSettings']);
$router->get   ('/api/admin/site/social',           ['Emailsly\Controllers\Admin\SiteAdmin', 'listSocial']);
$router->put   ('/api/admin/site/social/{id}',      ['Emailsly\Controllers\Admin\SiteAdmin', 'upsertSocial']);

$router->get   ('/api/admin/samples',               ['Emailsly\Controllers\Admin\SamplesAdmin', 'index']);
$router->post  ('/api/admin/samples',               ['Emailsly\Controllers\Admin\SamplesAdmin', 'create']);
$router->patch ('/api/admin/samples/{id}',          ['Emailsly\Controllers\Admin\SamplesAdmin', 'update']);
$router->delete('/api/admin/samples/{id}',          ['Emailsly\Controllers\Admin\SamplesAdmin', 'destroy']);

$router->get   ('/api/admin/analytics/overview',    ['Emailsly\Controllers\Admin\AnalyticsAdmin', 'overview']);

// Chatbot admin
$router->get   ('/api/admin/chatbot/conversations', ['Emailsly\Controllers\Admin\ChatbotAdmin', 'listConversations']);
$router->get   ('/api/admin/chatbot/orders',        ['Emailsly\Controllers\Admin\ChatbotAdmin', 'listOrders']);
$router->get   ('/api/admin/chatbot/tickets',       ['Emailsly\Controllers\Admin\ChatbotAdmin', 'listTickets']);
$router->get   ('/api/admin/chatbot/kb',            ['Emailsly\Controllers\Admin\ChatbotAdmin', 'listKb']);
$router->post  ('/api/admin/chatbot/kb',            ['Emailsly\Controllers\Admin\ChatbotAdmin', 'upsertKb']);

// Email / SMTP diagnostics
$router->post  ('/api/admin/test-email',            ['Emailsly\Controllers\Admin\MailAdmin', 'testSend']);

// Products (custom_products)
$router->get   ('/api/products',                    ['Emailsly\Controllers\Admin\ProductsAdmin', 'index']); // reuses admin fetcher; public list can filter status
$router->get   ('/api/admin/products',              ['Emailsly\Controllers\Admin\ProductsAdmin', 'index']);
$router->post  ('/api/admin/products',              ['Emailsly\Controllers\Admin\ProductsAdmin', 'create']);
$router->patch ('/api/admin/products/{id}',         ['Emailsly\Controllers\Admin\ProductsAdmin', 'update']);
$router->delete('/api/admin/products/{id}',         ['Emailsly\Controllers\Admin\ProductsAdmin', 'destroy']);

// Store offers
$router->get   ('/api/offers',                      ['Emailsly\Controllers\Admin\StoreOffersAdmin', 'publicList']);
$router->get   ('/api/admin/offers',                ['Emailsly\Controllers\Admin\StoreOffersAdmin', 'index']);
$router->post  ('/api/admin/offers',                ['Emailsly\Controllers\Admin\StoreOffersAdmin', 'create']);
$router->patch ('/api/admin/offers/{id}',           ['Emailsly\Controllers\Admin\StoreOffersAdmin', 'update']);
$router->delete('/api/admin/offers/{id}',           ['Emailsly\Controllers\Admin\StoreOffersAdmin', 'destroy']);

// Telegram bots
$router->get   ('/api/admin/telegram/bots',         ['Emailsly\Controllers\Admin\TelegramBotsAdmin', 'index']);
$router->post  ('/api/admin/telegram/bots',         ['Emailsly\Controllers\Admin\TelegramBotsAdmin', 'create']);
$router->patch ('/api/admin/telegram/bots/{id}',    ['Emailsly\Controllers\Admin\TelegramBotsAdmin', 'update']);
$router->delete('/api/admin/telegram/bots/{id}',    ['Emailsly\Controllers\Admin\TelegramBotsAdmin', 'destroy']);
$router->post  ('/api/admin/telegram/test',         ['Emailsly\Controllers\Admin\TelegramBotsAdmin', 'test']);

// Campaigns
$router->get   ('/api/admin/campaigns',             ['Emailsly\Controllers\Admin\CampaignsAdmin', 'index']);
$router->post  ('/api/admin/campaigns',             ['Emailsly\Controllers\Admin\CampaignsAdmin', 'create']);
$router->patch ('/api/admin/campaigns/{id}',        ['Emailsly\Controllers\Admin\CampaignsAdmin', 'update']);
$router->delete('/api/admin/campaigns/{id}',        ['Emailsly\Controllers\Admin\CampaignsAdmin', 'destroy']);

// Legacy CSV imports
$router->get   ('/api/admin/legacy-imports',        ['Emailsly\Controllers\Admin\LegacyImportsAdmin', 'index']);
$router->post  ('/api/admin/legacy-imports',        ['Emailsly\Controllers\Admin\LegacyImportsAdmin', 'import']);

// Orders bulk & timeline
$router->post  ('/api/admin/orders/bulk',           ['Emailsly\Controllers\Admin\OrdersAdmin', 'bulk']);
$router->get   ('/api/admin/orders/{id}/events',    ['Emailsly\Controllers\Admin\OrdersAdmin', 'events']);
$router->get   ('/api/admin/orders/{id}/messages',  ['Emailsly\Controllers\Admin\OrdersAdmin', 'messages']);
$router->post  ('/api/admin/orders/{id}/messages',  ['Emailsly\Controllers\Admin\OrdersAdmin', 'postMessage']);

// =========================================================
// Extras — gap-closure endpoints (see Extras.php)
// =========================================================
use Emailsly\Controllers\Extras;

// Auth / OTP
$router->post  ('/api/auth/otp/resend',              [Extras::class, 'otpResend']);
$router->post  ('/api/auth/otp/verify',              [Extras::class, 'otpVerify']);

// Public CMS aliases (client uses shorter paths)
$router->get   ('/api/site-settings',                [Extras::class, 'siteSettings']);
$router->get   ('/api/site-content',                 [Extras::class, 'siteContentList']);
$router->get   ('/api/site-content/{key}',           [Extras::class, 'siteContentGet']);
$router->get   ('/api/announcements',                [Extras::class, 'announcementsPublic']);
$router->get   ('/api/social-links',                 [Extras::class, 'socialLinksPublic']);

// Admin CMS
$router->get   ('/api/admin/site-settings',          [Extras::class, 'adminSiteSettingsGet']);
$router->patch ('/api/admin/site-settings',          [Extras::class, 'adminSiteSettingsUpdate']);
$router->put   ('/api/admin/site-settings',          [Extras::class, 'adminSiteSettingsUpdate']);
$router->put   ('/api/admin/site-content/{key}',     [Extras::class, 'adminSiteContentUpsert']);
$router->get   ('/api/admin/social-links',           [Extras::class, 'adminSocialLinksList']);
$router->put   ('/api/admin/social-links/{id}',      [Extras::class, 'adminSocialLinksUpsert']);
$router->post  ('/api/admin/social-links',           [Extras::class, 'adminSocialLinksUpsert']);
$router->delete('/api/admin/social-links/{id}',      [Extras::class, 'adminSocialLinksDelete']);

// Uploads aliases + sign/delete
$router->post  ('/api/uploads',                      ['Emailsly\Controllers\FileController', 'upload']);
$router->post  ('/api/uploads/sign',                 [Extras::class, 'uploadsSign']);
$router->delete('/api/uploads',                      [Extras::class, 'uploadsDelete']);

// Tickets alias (client uses /api/tickets)
$router->get   ('/api/tickets',                      [Extras::class, 'ticketsList']);
$router->post  ('/api/tickets',                      [Extras::class, 'ticketsCreate']);
$router->get   ('/api/tickets/{id}',                 [Extras::class, 'ticketsShow']);
$router->post  ('/api/tickets/{id}/messages',        [Extras::class, 'ticketsMessage']);
$router->post  ('/api/tickets/{id}/close',           [Extras::class, 'ticketsClose']);
$router->get   ('/api/admin/tickets/{id}',           [Extras::class, 'adminTicketsShow']);
$router->post  ('/api/admin/tickets/{id}/messages',  [Extras::class, 'adminTicketsPostMessage']);

// Admin users
$router->post  ('/api/admin/users/{id}/roles',       [Extras::class, 'adminUsersToggleRole']);
$router->patch ('/api/admin/users/{id}',             [Extras::class, 'adminUsersUpdate']);

// Reviews
$router->get   ('/api/reviews/mine',                 [Extras::class, 'reviewsMine']);
$router->post  ('/api/admin/reviews/{id}/moderate',  [Extras::class, 'reviewsModerate']);

// Orders
$router->get   ('/api/orders/{id}/invoice',          [Extras::class, 'orderInvoice']);

// Pricing
$router->post  ('/api/admin/pricing/publish',        [Extras::class, 'pricingPublish']);
$router->get   ('/api/admin/pricing/audit',          [Extras::class, 'pricingAudit']);

// Referrals
$router->post  ('/api/referrals/attach',             [Extras::class, 'referralsAttach']);
$router->get   ('/api/referrals/balance',            [Extras::class, 'referralsBalance']);
$router->get   ('/api/admin/referrals/stats',        [Extras::class, 'adminReferralsStats']);
$router->post  ('/api/admin/referrals/{id}/approve', [Extras::class, 'adminReferralApprove']);
$router->post  ('/api/admin/referrals/{id}/reject',  [Extras::class, 'adminReferralReject']);
$router->get   ('/api/admin/referrals/chain',        [Extras::class, 'adminReferralChain']);
$router->get   ('/api/admin/referrals/funnel',       [Extras::class, 'adminReferralFunnel']);
$router->get   ('/api/admin/referrals/leaderboard',  [Extras::class, 'adminReferralLeaderboard']);
$router->post  ('/api/admin/referrals/payout',       [Extras::class, 'adminReferralPayout']);
$router->get   ('/api/admin/referrals/owed.csv',     [Extras::class, 'adminReferralOwedCsv']);

// Blog analytics + SEO
$router->post  ('/api/blog/analytics/track',         [Extras::class, 'blogAnalyticsTrack']);
$router->get   ('/api/admin/blog/analytics/summary', [Extras::class, 'blogAnalyticsSummary']);
$router->get   ('/api/admin/blog/analytics/{slug}',  [Extras::class, 'blogAnalyticsSlug']);
$router->get   ('/api/blog/seo/{slug}',              [Extras::class, 'blogSeoPublic']);
$router->get   ('/api/admin/blog-seo',               [Extras::class, 'adminBlogSeoList']);
$router->put   ('/api/admin/blog-seo/{slug}',        [Extras::class, 'adminBlogSeoUpsert']);
$router->delete('/api/admin/blog-seo/{slug}',        [Extras::class, 'adminBlogSeoDelete']);

// Product details CMS
$router->get   ('/api/product-details/{slug}',       [Extras::class, 'productDetailsPublic']);
$router->get   ('/api/admin/product-details',        [Extras::class, 'adminProductDetailsList']);
$router->put   ('/api/admin/product-details/{slug}', [Extras::class, 'adminProductDetailsUpsert']);
$router->delete('/api/admin/product-details/{slug}', [Extras::class, 'adminProductDetailsDelete']);

// Chatbot (public surface)
$router->get   ('/api/chatbot/config',               [Extras::class, 'chatbotConfigPublic']);
$router->get   ('/api/chatbot/kb',                   [Extras::class, 'chatbotKbPublic']);
$router->post  ('/api/chatbot/conversations/start',  [Extras::class, 'chatbotConversationStart']);
$router->get   ('/api/chatbot/messages',             [Extras::class, 'chatbotMessagesGet']);
$router->post  ('/api/chatbot/messages',             [Extras::class, 'chatbotMessagePost']);
$router->post  ('/api/chatbot/handoff',              [Extras::class, 'chatbotHandoff']);
$router->post  ('/api/chatbot/lookup-order',         [Extras::class, 'chatbotLookupOrder']);
$router->post  ('/api/chatbot/orders',               [Extras::class, 'chatbotCreateOrder']);
$router->post  ('/api/chatbot/tickets',              [Extras::class, 'chatbotCreateTicket']);
$router->get   ('/api/admin/chatbot/config',         [Extras::class, 'adminChatbotConfigGet']);
$router->put   ('/api/admin/chatbot/config',         [Extras::class, 'adminChatbotConfigSave']);
$router->get   ('/api/admin/chatbot/messages',       [Extras::class, 'adminChatbotMessagesList']);
$router->post  ('/api/admin/chatbot/reply',          [Extras::class, 'adminChatbotReply']);
$router->post  ('/api/admin/chatbot/close',          [Extras::class, 'adminChatbotClose']);
$router->delete('/api/admin/chatbot/kb/{id}',        [Extras::class, 'adminChatbotKbDelete']);
$router->post  ('/api/admin/chatbot/kb/sync',        [Extras::class, 'adminChatbotKbSync']);
$router->post  ('/api/admin/chatbot/orders',         [Extras::class, 'adminChatbotOrderUpsert']);
$router->patch ('/api/admin/chatbot/orders/{id}',    [Extras::class, 'adminChatbotOrderUpsert']);
$router->delete('/api/admin/chatbot/orders/{id}',    [Extras::class, 'adminChatbotOrderDelete']);
$router->patch ('/api/admin/chatbot/tickets/{id}',   [Extras::class, 'adminChatbotTicketUpdate']);
$router->post  ('/api/public/telegram/webhook',      [Extras::class, 'adminChatbotTelegramWebhook']);

// Conversion events + server-side tracking
$router->get   ('/api/conversion-events',            [Extras::class, 'conversionEventsPublic']);
$router->get   ('/api/admin/conversion-events',      [Extras::class, 'adminConversionEventsList']);
$router->post  ('/api/admin/conversion-events',      [Extras::class, 'adminConversionEventUpsert']);
$router->patch ('/api/admin/conversion-events/{id}', [Extras::class, 'adminConversionEventUpsert']);
$router->delete('/api/admin/conversion-events/{id}', [Extras::class, 'adminConversionEventDelete']);
$router->get   ('/api/admin/server-tracking',        [Extras::class, 'adminServerTrackingGet']);
$router->put   ('/api/admin/server-tracking',        [Extras::class, 'adminServerTrackingUpdate']);
$router->post  ('/api/admin/server-tracking/log',    [Extras::class, 'adminServerTrackingLog']);

// Samples / datasets
$router->get   ('/api/samples/data',                 [Extras::class, 'samplesData']);
$router->get   ('/api/admin/sample-datasets',        [Extras::class, 'adminSampleDatasetsList']);
$router->post  ('/api/admin/sample-datasets',        [Extras::class, 'adminSampleDatasetsUpsert']);
$router->patch ('/api/admin/sample-datasets/{id}',   [Extras::class, 'adminSampleDatasetsUpsert']);
$router->post  ('/api/admin/sample-datasets/upload', [Extras::class, 'adminSampleDatasetsUpload']);
$router->get   ('/api/admin/sample-datasets/audit',  [Extras::class, 'adminSampleDatasetsAudit']);
$router->get   ('/api/admin/sample-datasets/preview',[Extras::class, 'adminSampleDatasetsPreview']);

// Backup / portability
$router->get   ('/api/admin/backup/export',          [Extras::class, 'adminBackupExport']);
$router->post  ('/api/admin/backup/restore',         [Extras::class, 'adminBackupRestore']);
$router->get   ('/api/admin/portability/export',     [Extras::class, 'adminPortabilityExport']);
$router->post  ('/api/admin/portability/import',     [Extras::class, 'adminPortabilityImport']);

// Misc admin
$router->post  ('/api/admin/drive/fetch',            [Extras::class, 'adminDriveFetch']);
$router->get   ('/api/admin/stripe/events',          [Extras::class, 'adminStripeEvents']);
$router->get   ('/api/admin/stripe/deliveries',      [Extras::class, 'adminStripeDeliveries']);

// Mail admin (log viewer + DNS check)
$router->get   ('/api/admin/mail-logs',              ['Emailsly\Controllers\Admin\MailAdmin', 'logs']);
$router->post  ('/api/admin/mail-logs/clear',        ['Emailsly\Controllers\Admin\MailAdmin', 'clearLogs']);
$router->get   ('/api/admin/dns-check',              ['Emailsly\Controllers\Admin\MailAdmin', 'dnsCheck']);




// Dispatch
try {
    $router->dispatch(
        $_SERVER['REQUEST_METHOD'],
        parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/'
    );
} catch (\Throwable $e) {
    error_log('[Emailsly] ' . $e->getMessage() . "\n" . $e->getTraceAsString());
    Response::error(($_ENV['APP_ENV'] ?? 'production') === 'production'
        ? 'Server error'
        : $e->getMessage(), 500);
}
