<?php
require_once __DIR__ . '/_init.php';
require_method('POST');
$me = require_admin();

$d    = body();
$id   = (int)($d['id'] ?? 0);
$role = (string)($d['role'] ?? '');

if (!$id) json_out(['error' => 'missing id'], 422);
if (!in_array($role, ['user','engineer','admin'], true))
    json_out(['error' => 'role ไม่ถูกต้อง'], 422);

// prevent an admin from demoting themselves (avoid lockout)
if ($id === (int)$me['id'] && $role !== 'admin')
    json_out(['error' => 'ไม่สามารถลดสิทธิ์ของตัวเองได้'], 409);

$exists = db()->prepare('SELECT id FROM users WHERE id = ?');
$exists->execute([$id]);
if (!$exists->fetch()) json_out(['error' => 'not_found'], 404);

db()->prepare('UPDATE users SET role = ? WHERE id = ?')->execute([$role, $id]);
json_out(['ok' => true]);
