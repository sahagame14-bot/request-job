<?php
require_once __DIR__ . '/_init.php';
require_method('POST');
require_admin();

$d          = body();
$name       = trim((string)($d['name'] ?? ''));
$username   = strtolower(trim((string)($d['username'] ?? '')));
$password   = (string)($d['password'] ?? '');
$department = trim((string)($d['department'] ?? ''));
$role       = (string)($d['role'] ?? 'user');

if ($name === '' || $username === '' || $password === '')
    json_out(['error' => 'กรุณากรอกชื่อ, username และรหัสผ่าน'], 422);
if (!preg_match('/^[a-z0-9_]{3,60}$/', $username))
    json_out(['error' => 'Username ต้องเป็น a-z, 0-9, _ (3-60 ตัว)'], 422);
if (strlen($password) < 8)
    json_out(['error' => 'รหัสผ่านอย่างน้อย 8 ตัว'], 422);
if (!in_array($role, ['user','engineer','admin'], true))
    json_out(['error' => 'role ไม่ถูกต้อง'], 422);

$exists = db()->prepare('SELECT id FROM users WHERE username = ?');
$exists->execute([$username]);
if ($exists->fetch()) json_out(['error' => 'Username นี้ถูกใช้แล้ว'], 409);

db()->prepare('INSERT INTO users (name, username, password_hash, department, role) VALUES (?,?,?,?,?)')
    ->execute([$name, $username, password_hash($password, PASSWORD_DEFAULT), $department, $role]);

json_out(['ok' => true, 'id' => (int) db()->lastInsertId()]);
