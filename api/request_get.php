<?php
require_once __DIR__ . '/_init.php';
$user = require_login();

$id = (int)($_GET['id'] ?? 0);
if (!$id) json_out(['error' => 'missing id'], 422);

$stmt = db()->prepare('SELECT * FROM requests WHERE id = ?');
$stmt->execute([$id]);
$req = $stmt->fetch();
if (!$req) json_out(['error' => 'not_found'], 404);

// access: owner, or engineer/admin
if ($req['created_by'] != $user['id'] && !in_array($user['role'], ['engineer','admin'], true))
    json_out(['error' => 'forbidden'], 403);

$eq = db()->prepare('SELECT seq, item, qty FROM request_equipment WHERE request_id = ? ORDER BY seq');
$eq->execute([$id]);
$req['equipment'] = $eq->fetchAll();

json_out(['request' => $req]);
