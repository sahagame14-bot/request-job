<?php
require_once __DIR__ . '/_init.php';
require_method('POST');

const MAX_ATTEMPTS = 5;          // failures allowed ...
const WINDOW_SEC   = 300;        // ... within this window (5 min)
const LOCK_SEC     = 300;        // lock duration once exceeded

$d = body();
$username = strtolower(trim((string)($d['username'] ?? '')));
$password = (string)($d['password'] ?? '');
$ip = client_ip();

if ($username === '' || $password === '')
    json_out(['error' => 'กรุณากรอก Username และรหัสผ่าน'], 422);

// ----- count recent failed attempts -----
$cnt = db()->prepare(
    'SELECT COUNT(*) c, MAX(created_at) last
       FROM login_attempts
      WHERE username = ? AND ip = ? AND success = 0
        AND created_at > (NOW() - INTERVAL ? SECOND)'
);
$cnt->execute([$username, $ip, WINDOW_SEC]);
$row = $cnt->fetch();
$fails = (int) $row['c'];

if ($fails >= MAX_ATTEMPTS) {
    $lastTs   = strtotime($row['last']);
    $retry    = LOCK_SEC - (time() - $lastTs);
    if ($retry > 0) json_out(['error' => 'ถูกล็อกชั่วคราว', 'retry_after' => $retry], 429);
}

// ----- verify -----
$stmt = db()->prepare('SELECT id, password_hash FROM users WHERE username = ?');
$stmt->execute([$username]);
$user = $stmt->fetch();

$ok = $user && password_verify($password, $user['password_hash']);

$log = db()->prepare('INSERT INTO login_attempts (username, ip, success) VALUES (?,?,?)');
$log->execute([$username, $ip, $ok ? 1 : 0]);

if (!$ok) {
    $attempts = $fails + 1;
    json_out([
        'error'    => 'Username หรือรหัสผ่านไม่ถูกต้อง',
        'attempts' => $attempts,
        'max'      => MAX_ATTEMPTS,
    ], 401);
}

// success — clear failures, start session
db()->prepare('DELETE FROM login_attempts WHERE username = ? AND ip = ?')
    ->execute([$username, $ip]);
session_regenerate_id(true);
$_SESSION['uid'] = (int) $user['id'];
json_out(['ok' => true]);
