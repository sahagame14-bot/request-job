<?php
require_once __DIR__ . '/_init.php';
require_method('DELETE');
$user = require_login();

$d  = body();
$id = (int)($d['id'] ?? 0);
if (!$id) json_out(['error' => 'missing id'], 422);

$stmt = db()->prepare('SELECT created_by, status, picture_path, pdf_path FROM requests WHERE id = ?');
$stmt->execute([$id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row) json_out(['error' => 'not found'], 404);

// admin may delete anything; the owner may delete their own request only while it
// is still Pending (i.e. before an engineer has picked it up).
$isAdmin = ($user['role'] === 'admin');
$isOwner = ((int)$row['created_by'] === (int)$user['id']);
if (!$isAdmin) {
    if (!$isOwner) json_out(['error' => 'forbidden'], 403);
    if ($row['status'] !== 'pending')
        json_out(['error' => 'ลบได้เฉพาะงานที่ยังเป็น Pending เท่านั้น'], 409);
}

db()->prepare('DELETE FROM requests WHERE id = ?')->execute([$id]);

foreach (['picture_path', 'pdf_path'] as $col) {
    if (!empty($row[$col])) {
        $abs = realpath(__DIR__ . '/../' . ltrim($row[$col], '/\\'));
        if ($abs && str_starts_with($abs, realpath(__DIR__ . '/../uploads'))) {
            @unlink($abs);
        }
    }
}

json_out(['ok' => true]);
