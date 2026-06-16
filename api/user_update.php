<?php
require_once __DIR__ . '/_init.php';
require_method('POST');
$me = require_admin();

$d          = body();
$id         = (int)($d['id'] ?? 0);
$name       = trim((string)($d['name'] ?? ''));
$department = trim((string)($d['department'] ?? ''));
$role       = (string)($d['role'] ?? '');
$password   = (string)($d['password'] ?? '');   // optional — blank = keep current

if (!$id) json_out(['error' => 'missing id'], 422);
if ($name === '') json_out(['error' => 'กรุณากรอกชื่อ'], 422);
if (!in_array($role, ['user','engineer','admin'], true))
    json_out(['error' => 'role ไม่ถูกต้อง'], 422);
if ($password !== '' && strlen($password) < 8)
    json_out(['error' => 'รหัสผ่านอย่างน้อย 8 ตัว'], 422);

// prevent self-demote lockout
if ($id === (int)$me['id'] && $role !== 'admin')
    json_out(['error' => 'ไม่สามารถลดสิทธิ์ของตัวเองได้'], 409);

$exists = db()->prepare('SELECT id FROM users WHERE id = ?');
$exists->execute([$id]);
if (!$exists->fetch()) json_out(['error' => 'not_found'], 404);

if ($password !== '') {
    db()->prepare('UPDATE users SET name=?, department=?, role=?, password_hash=? WHERE id=?')
        ->execute([$name, $department, $role, password_hash($password, PASSWORD_DEFAULT), $id]);
} else {
    db()->prepare('UPDATE users SET name=?, department=?, role=? WHERE id=?')
        ->execute([$name, $department, $role, $id]);
}

json_out(['ok' => true]);
