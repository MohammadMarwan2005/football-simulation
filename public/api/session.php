<?php
declare(strict_types=1);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method not allowed']);
    exit;
}

// .env lives one level above the dist/ webroot so it is never web-accessible.
// File layout on the server:
//   /var/www/football-simulation/.env           <-- here
//   /var/www/football-simulation/dist/          <-- web root (rsynced from local dist/)
//   /var/www/football-simulation/dist/api/session.php
$envPath = __DIR__ . '/../../.env';
if (!is_readable($envPath)) {
    error_log("session.php: .env not readable at $envPath");
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'config missing']);
    exit;
}

$env = [];
foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    $line = trim($line);
    if ($line === '' || $line[0] === '#') continue;
    $parts = explode('=', $line, 2);
    if (count($parts) !== 2) continue;
    $env[trim($parts[0])] = trim($parts[1], " \t\"'");
}

$raw  = file_get_contents('php://input') ?: '';
$body = json_decode($raw, true);
if (!is_array($body)) $body = [];

function clientIp(): string {
    foreach (['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'] as $key) {
        if (!empty($_SERVER[$key])) {
            return trim(explode(',', $_SERVER[$key])[0]);
        }
    }
    return '';
}

$ip   = clientIp();
$ua   = $_SERVER['HTTP_USER_AGENT']     ?? '';
$ref  = $_SERVER['HTTP_REFERER']        ?? '';
$lang = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '';

// Geo lookup via ipwho.is (HTTPS, no API key). Short timeout — we never want to
// hang the request on a slow third party.
$geo = ['country'=>null,'region'=>null,'city'=>null,'lat'=>null,'lng'=>null,'isp'=>null,'tz'=>null];
$isPublicIp = $ip && filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
if ($isPublicIp) {
    $ctx = stream_context_create(['http' => ['timeout' => 2, 'ignore_errors' => true]]);
    $rawGeo = @file_get_contents("https://ipwho.is/" . urlencode($ip), false, $ctx);
    if ($rawGeo !== false) {
        $g = json_decode($rawGeo, true);
        if (is_array($g) && !empty($g['success'])) {
            $geo['country'] = $g['country']                ?? null;
            $geo['region']  = $g['region']                 ?? null;
            $geo['city']    = $g['city']                   ?? null;
            $geo['lat']     = $g['latitude']               ?? null;
            $geo['lng']     = $g['longitude']              ?? null;
            $geo['isp']     = $g['connection']['isp']      ?? null;
            $geo['tz']      = $g['timezone']['id']         ?? null;
        }
    }
}

function parseUA(string $ua): array {
    $browser = 'Unknown'; $os = 'Unknown'; $device = 'Desktop';
    if      (stripos($ua, 'Edg/')     !== false) $browser = 'Edge';
    elseif  (stripos($ua, 'OPR/')     !== false || stripos($ua, 'Opera') !== false) $browser = 'Opera';
    elseif  (stripos($ua, 'Chrome/')  !== false && stripos($ua, 'Chromium') === false) $browser = 'Chrome';
    elseif  (stripos($ua, 'Firefox/') !== false) $browser = 'Firefox';
    elseif  (stripos($ua, 'Safari/')  !== false) $browser = 'Safari';

    if      (stripos($ua, 'Windows')   !== false) $os = 'Windows';
    elseif  (stripos($ua, 'Android')   !== false) $os = 'Android';
    elseif  (stripos($ua, 'iPhone')    !== false || stripos($ua, 'iPad') !== false) $os = 'iOS';
    elseif  (stripos($ua, 'Mac OS')    !== false || stripos($ua, 'Macintosh') !== false) $os = 'macOS';
    elseif  (stripos($ua, 'Linux')     !== false) $os = 'Linux';

    if (stripos($ua, 'Mobile') !== false || stripos($ua, 'Android') !== false) $device = 'Mobile';
    if (stripos($ua, 'iPad')   !== false || stripos($ua, 'Tablet')  !== false) $device = 'Tablet';
    return [$browser, $os, $device];
}
[$browser, $os, $device] = parseUA($ua);

try {
    $pdo = new PDO(
        sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $env['DB_HOST']     ?? '127.0.0.1',
            $env['DB_PORT']     ?? '3306',
            $env['DB_DATABASE'] ?? ''
        ),
        $env['DB_USERNAME'] ?? '',
        $env['DB_PASSWORD'] ?? '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Throwable $e) {
    error_log('session.php DB connect: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'db']);
    exit;
}

$sql = "INSERT INTO sessions (
    ip, country, region, city, latitude, longitude, isp, geo_timezone,
    user_agent, browser, os, device_type, referer, accept_language,
    language, languages, timezone,
    screen_w, screen_h, viewport_w, viewport_h, pixel_ratio,
    cpu_cores, device_memory, gpu_vendor, gpu_renderer,
    touch_support, cookies_enabled, do_not_track,
    connection_type, downlink, rtt,
    fingerprint, page_url, raw_json
) VALUES (
    :ip, :country, :region, :city, :latitude, :longitude, :isp, :geo_timezone,
    :user_agent, :browser, :os, :device_type, :referer, :accept_language,
    :language, :languages, :timezone,
    :screen_w, :screen_h, :viewport_w, :viewport_h, :pixel_ratio,
    :cpu_cores, :device_memory, :gpu_vendor, :gpu_renderer,
    :touch_support, :cookies_enabled, :do_not_track,
    :connection_type, :downlink, :rtt,
    :fingerprint, :page_url, :raw_json
)";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':ip'              => $ip ?: null,
        ':country'         => $geo['country'],
        ':region'          => $geo['region'],
        ':city'            => $geo['city'],
        ':latitude'        => $geo['lat'],
        ':longitude'       => $geo['lng'],
        ':isp'             => $geo['isp'],
        ':geo_timezone'    => $geo['tz'],
        ':user_agent'      => $ua  ?: null,
        ':browser'         => $browser,
        ':os'              => $os,
        ':device_type'     => $device,
        ':referer'         => $ref ?: null,
        ':accept_language' => $lang ?: null,
        ':language'        => $body['language']        ?? null,
        ':languages'       => isset($body['languages']) ? implode(',', (array)$body['languages']) : null,
        ':timezone'        => $body['timezone']        ?? null,
        ':screen_w'        => $body['screen_w']        ?? null,
        ':screen_h'        => $body['screen_h']        ?? null,
        ':viewport_w'      => $body['viewport_w']      ?? null,
        ':viewport_h'      => $body['viewport_h']      ?? null,
        ':pixel_ratio'     => $body['pixel_ratio']     ?? null,
        ':cpu_cores'       => $body['cpu_cores']       ?? null,
        ':device_memory'   => $body['device_memory']   ?? null,
        ':gpu_vendor'      => $body['gpu_vendor']      ?? null,
        ':gpu_renderer'    => $body['gpu_renderer']    ?? null,
        ':touch_support'   => !empty($body['touch_support']) ? 1 : 0,
        ':cookies_enabled' => !empty($body['cookies_enabled']) ? 1 : 0,
        ':do_not_track'    => $body['do_not_track']    ?? null,
        ':connection_type' => $body['connection_type'] ?? null,
        ':downlink'        => $body['downlink']        ?? null,
        ':rtt'             => $body['rtt']             ?? null,
        ':fingerprint'     => $body['fingerprint']     ?? null,
        ':page_url'        => $body['page_url']        ?? null,
        ':raw_json'        => json_encode($body, JSON_UNESCAPED_UNICODE),
    ]);

    echo json_encode(['ok' => true, 'id' => (int) $pdo->lastInsertId()]);
} catch (Throwable $e) {
    error_log('session.php INSERT: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'insert']);
}
