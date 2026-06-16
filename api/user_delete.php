<?php
require_once __DIR__ . '/_init.php';
require_method('POST');
$me = require_admin();

$d  = body();
$id = (int)($d['id'] ?? 0);
if (!$id) json_out(['error' => 'missing id'], 422);
if ($id === (int)$me['id']) json_out(['error' => 'ไม่สามารถลบบัญชีของตัวเองได้'], 409);

$exists = db()->prepare('SELECT id FROM users WHERE id = ?');
$exists->execute([$id]);
if (!$exists->fetch()) json_out(['error' => 'not_found'], 404);

// requests.created_by has ON DELETE SET NULL, so their tickets remain
db()->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
json_out(['ok' => true]);
