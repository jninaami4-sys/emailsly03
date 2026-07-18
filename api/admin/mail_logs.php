<?php
declare(strict_types=1);
Auth::requireAdmin();

$limit = max(1, min(500, (int)($_GET['limit'] ?? 100)));
$kind  = isset($_GET['kind']) ? (string)$_GET['kind'] : '';
$q     = isset($_GET['q']) ? trim((string)$_GET['q']) : '';

$path = __DIR__ . '/../logs/mail.log';
if (!is_file($path)) Response::json(['path'=>$path,'exists'=>false,'entries'=>[],'total'=>0]);

$size = filesize($path);
$raw  = file_get_contents($path) ?: '';
// Read from the end for perf on big logs (keep last 2MB)
if (strlen($raw) > 2_000_000) $raw = substr($raw, -2_000_000);

$blocks = preg_split('/\n---\n/', $raw, -1, PREG_SPLIT_NO_EMPTY) ?: [];
$entries = [];
foreach ($blocks as $b) {
    $b = trim($b);
    if ($b === '') continue;
    $lines = explode("\n", $b, 3);
    $header = $lines[0] ?? '';
    $metaLine = $lines[1] ?? '';
    $html = $lines[2] ?? '';
    $entry = ['ts'=>null,'to'=>null,'subject'=>null,'kind'=>null,'from'=>null,'transport'=>null,'bytes'=>strlen($html),'html'=>$html,'text'=>trim(strip_tags($html))];
    if (preg_match('/^\[(?<ts>[^\]]+)\]\s*(?:KIND=(?<kind>\S+)\s+FROM=(?<from>\S+)\s+TO=(?<to>\S+)|TO\s+(?<to2>\S+))\s*::\s*(?<subject>.+)$/', $header, $m)) {
        $entry['ts']      = $m['ts'] ?: null;
        $entry['kind']    = $m['kind'] ?: null;
        $entry['from']    = $m['from'] ?: null;
        $entry['to']      = ($m['to'] ?: ($m['to2'] ?? null));
        $entry['subject'] = trim($m['subject']);
    }
    if (str_starts_with($metaLine, 'META: ')) {
        $meta = json_decode(substr($metaLine, 6), true);
        if (is_array($meta)) {
            foreach (['ts','to','subject','kind','from','transport','bytes'] as $k) {
                if (!empty($meta[$k])) $entry[$k] = $meta[$k];
            }
        }
    } else {
        // Old-format entry: html actually starts on line 2
        $entry['html'] = trim($metaLine . "\n" . $html);
        $entry['text'] = trim(strip_tags($entry['html']));
        $entry['bytes'] = strlen($entry['html']);
    }
    $entries[] = $entry;
}
$entries = array_reverse($entries); // newest first

if ($kind !== '') $entries = array_values(array_filter($entries, fn($e) => ($e['kind'] ?? '') === $kind));
if ($q !== '') {
    $needle = mb_strtolower($q);
    $entries = array_values(array_filter($entries, function($e) use ($needle) {
        return str_contains(mb_strtolower(($e['to'] ?? '').' '.($e['subject'] ?? '').' '.($e['from'] ?? '').' '.($e['text'] ?? '')), $needle);
    }));
}

$total = count($entries);
$entries = array_slice($entries, 0, $limit);

Response::json([
    'path'      => $path,
    'exists'    => true,
    'file_size' => $size,
    'total'     => $total,
    'limit'     => $limit,
    'entries'   => $entries,
]);
