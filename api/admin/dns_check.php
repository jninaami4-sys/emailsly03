<?php
declare(strict_types=1);
Auth::requireAdmin();

$domain   = trim((string)($_GET['domain'] ?? 'mail.emailsly.com'));
$selector = trim((string)($_GET['selector'] ?? 'default'));
if ($domain === '' || !preg_match('/^[a-z0-9.\-]+$/i', $domain)) Response::error('Invalid domain', 422);
if ($selector === '' || !preg_match('/^[a-z0-9_\-]+$/i', $selector)) Response::error('Invalid selector', 422);

function txtRecords(string $host): array {
    $r = @dns_get_record($host, DNS_TXT);
    if (!$r) return [];
    $out = [];
    foreach ($r as $row) {
        $val = '';
        if (!empty($row['entries']) && is_array($row['entries'])) $val = implode('', $row['entries']);
        elseif (!empty($row['txt'])) $val = (string)$row['txt'];
        if ($val !== '') $out[] = $val;
    }
    return $out;
}
function mxRecords(string $host): array {
    $r = @dns_get_record($host, DNS_MX);
    if (!$r) return [];
    return array_map(fn($x) => ['host'=>$x['target'] ?? '', 'pri'=>$x['pri'] ?? 0], $r);
}

$spfHost   = $domain;
$dmarcHost = '_dmarc.' . $domain;
$dkimHost  = "{$selector}._domainkey.{$domain}";

$spfTxt   = txtRecords($spfHost);
$dmarcTxt = txtRecords($dmarcHost);
$dkimTxt  = txtRecords($dkimHost);
$mx       = mxRecords($domain);

$spf = null;
foreach ($spfTxt as $t) if (stripos($t, 'v=spf1') === 0) { $spf = $t; break; }
$dmarc = null;
foreach ($dmarcTxt as $t) if (stripos($t, 'v=DMARC1') === 0) { $dmarc = $t; break; }
$dkim = null;
foreach ($dkimTxt as $t) if (stripos($t, 'v=DKIM1') !== false || stripos($t, 'k=') !== false || stripos($t, 'p=') !== false) { $dkim = $t; break; }

// Heuristic health checks
$spfWarn = [];
if ($spf) {
    if (!preg_match('/[-~]all\s*$/i', $spf)) $spfWarn[] = 'SPF should end with ~all or -all.';
    if (!preg_match('/(include:|ip4:|ip6:|a\b|mx\b)/i', $spf)) $spfWarn[] = 'SPF has no mechanisms (include:/ip4:/mx).';
}
$dmarcWarn = [];
if ($dmarc) {
    if (!preg_match('/\bp=(none|quarantine|reject)\b/i', $dmarc)) $dmarcWarn[] = 'DMARC missing policy tag p=.';
    if (!preg_match('/\brua=mailto:/i', $dmarc)) $dmarcWarn[] = 'Add rua=mailto:you@domain for aggregate reports.';
}
$dkimWarn = [];
if ($dkim && !preg_match('/\bp=[A-Za-z0-9+\/=]{50,}/', $dkim)) $dkimWarn[] = 'DKIM public key (p=) missing or too short.';

Response::json([
    'domain'   => $domain,
    'selector' => $selector,
    'checked_at' => date('c'),
    'records' => [
        'spf' => [
            'host'      => $spfHost,
            'type'      => 'TXT',
            'found'     => $spf !== null,
            'value'     => $spf,
            'all_txt'   => $spfTxt,
            'warnings'  => $spfWarn,
            'suggested' => 'v=spf1 include:_spf.hostinger.com ~all',
            'hint'      => 'Replace include: with your SMTP provider (e.g. _spf.google.com, spf.mailgun.org, servers.mcsv.net, or your cPanel host).',
        ],
        'dkim' => [
            'host'      => $dkimHost,
            'type'      => 'TXT',
            'found'     => $dkim !== null,
            'value'     => $dkim,
            'all_txt'   => $dkimTxt,
            'warnings'  => $dkimWarn,
            'suggested' => 'v=DKIM1; k=rsa; p=<PUBLIC_KEY_FROM_MAIL_PROVIDER>',
            'hint'      => "Your mail provider (cPanel > Email Deliverability, Google, Mailgun, etc.) generates the DKIM key for selector \"$selector\". Copy their exact TXT value.",
        ],
        'dmarc' => [
            'host'      => $dmarcHost,
            'type'      => 'TXT',
            'found'     => $dmarc !== null,
            'value'     => $dmarc,
            'all_txt'   => $dmarcTxt,
            'warnings'  => $dmarcWarn,
            'suggested' => "v=DMARC1; p=quarantine; rua=mailto:postmaster@{$domain}; ruf=mailto:postmaster@{$domain}; fo=1; adkim=s; aspf=s",
            'hint'      => 'Start with p=none for monitoring, then move to p=quarantine and p=reject after DKIM/SPF are aligned.',
        ],
        'mx' => [
            'host'  => $domain,
            'type'  => 'MX',
            'found' => count($mx) > 0,
            'value' => $mx,
            'hint'  => 'MX is only required if this subdomain also receives mail. Sending-only domains do not need MX.',
        ],
    ],
    'summary' => [
        'spf_ok'   => $spf !== null && !$spfWarn,
        'dkim_ok'  => $dkim !== null && !$dkimWarn,
        'dmarc_ok' => $dmarc !== null && !$dmarcWarn,
    ],
]);
