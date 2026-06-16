<?php
require_once __DIR__ . '/_init.php';
require_method('POST');
$user = require_login();

// Attach (or clear) the PDF of a request. Allowed for the request OWNER
// (so an ordinary employee can attach their own document) or engineer/admin.
$d  = body();
$id = (int)($d['id'] ?? 0);
if (!$id) json_out(['error' => 'missing id'], 422);

$pdf = trim((string)($d['pdf_path'] ?? ''));

$stmt = db()->prepare('SELECT created_by FROM requests WHERE id = ?');
$stmt->execute([$id]);
$row = $stmt->fetch();
if (!$row) json_out(['error' => 'not_found'], 404);

$isOwner = ((int)$row['created_by'] === (int)$user['id']);
if (!$isOwner && !in_array($user['role'], ['engineer', 'admin'], true))
    json_out(['error' => 'forbidden'], 403);

// validate the path: must point to an existing .pdf inside uploads/ (or empty = clear)
$newPath = null;
if ($pdf !== '') {
    if (!preg_match('#^uploads/[A-Za-z0-9._\-]+\.pdf$#', $pdf))
        json_out(['error' => 'ไฟล์ไม่ถูกต้อง'], 422);
    $abs  = realpath(__DIR__ . '/../' . $pdf);
    $base = realpath(__DIR__ . '/../uploads');
    if (!$abs || !$base || !str_starts_with($abs, $base))
        json_out(['error' => 'path ไม่ถูกต้อง'], 422);
    // enforce the 3MB cap on the stored file (server-side, can't be bypassed)
    if (filesize($abs) > 3 * 1024 * 1024)
        json_out(['error' => 'ไฟล์ PDF ใหญ่เกิน 3MB'], 422);
    $newPath = $pdf;
}

db()->prepare('UPDATE requests SET pdf_path = ? WHERE id = ?')->execute([$newPath, $id]);
json_out(['ok' => true, 'pdf_path' => $newPath]);
