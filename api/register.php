<?php
require_once __DIR__ . '/_init.php';
require_method('POST');

// Self-registration stays open (employees sign themselves up), but is rate-limited
// per IP to stop bulk/spam account creation. Tracked in login_attempts with a
// sentinel username so it never collides with real login bookkeeping.
const REG_MAX    = 20;      // new accounts per IP ... (generous: a whole office may
const REG_WINDOW = 3600;    // share one public IP) ... within this window (1 hour)
const REG_TAG    = '__register__';

$d = body();
$name       = trim((string)($d['name'] ?? ''));
$username   = strtolower(trim((string)($d['username'] ?? '')));
$password   = (string)($d['password'] ?? '');
$department = trim((string)($d['department'] ?? ''));

if ($name === '' || $username === '' || $password === '')
    json_out(['error' => 'กรุณากรอกข้อมูลให้ครบ'], 422);
if (!preg_match('/^[a-z0-9_]{3,60}$/', $username))
    json_out(['error' => 'Username ต้องเป็น a-z, 0-9, _ (3-60 ตัว)'], 422);
if (strlen($password) < 8)
    json_out(['error' => 'รหัสผ่านอย่างน้อย 8 ตัว'], 422);

// ----- rate-limit: cap registrations per IP -----
$ip = client_ip();
$rc = db()->prepare(
    'SELECT COUNT(*) c FROM login_attempts
       WHERE ip = ? AND username = ?
         AND created_at > (NOW() - INTERVAL ? SECOND)'
);
$rc->execute([$ip, REG_TAG, REG_WINDOW]);
if ((int) $rc->fetch()['c'] >= REG_MAX)
    json_out(['error' => 'สมัครบ่อยเกินไป กรุณาลองใหม่ภายหลัง'], 429);

$exists = db()->prepare('SELECT id FROM users WHERE username = ?');
$exists->execute([$username]);
if ($exists->fetch()) json_out(['error' => 'Username นี้ถูกใช้แล้ว'], 409);

$stmt = db()->prepare(
    'INSERT INTO users (name, username, password_hash, department) VALUES (?,?,?,?)'
);
$stmt->execute([$name, $username, password_hash($password, PASSWORD_DEFAULT), $department]);

// record this registration against the IP for the rate-limit window
db()->prepare('INSERT INTO login_attempts (username, ip, success) VALUES (?,?,1)')
    ->execute([REG_TAG, $ip]);

session_regenerate_id(true);
$_SESSION['uid'] = (int) db()->lastInsertId();
json_out(['ok' => true]);
