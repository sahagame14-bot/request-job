<?php
require_once __DIR__ . '/_init.php';
require_method('POST');
$user = require_login();

// The OWNER may edit their own request's page-1 (REQUEST) fields while it is
// still Pending — i.e. before an engineer picks it up. Admin may edit anytime.
// (Engineers use request_update.php for the page-2 OPERATION fields.)
$d  = body();
$id = (int)($d['id'] ?? 0);
if (!$id) json_out(['error' => 'missing id'], 422);

$stmt = db()->prepare('SELECT created_by, status FROM requests WHERE id = ?');
$stmt->execute([$id]);
$row = $stmt->fetch();
if (!$row) json_out(['error' => 'not_found'], 404);

$isAdmin = ($user['role'] === 'admin');
$isOwner = ((int)$row['created_by'] === (int)$user['id']);
if (!$isAdmin) {
    if (!$isOwner) json_out(['error' => 'forbidden'], 403);
    if ($row['status'] !== 'pending')
        json_out(['error' => 'แก้ไขได้เฉพาะงานที่ยังเป็น Pending เท่านั้น'], 409);
}

$forSection = in_array(($d['for_section'] ?? ''), ['IT','Production Engineer'], true)
              ? $d['for_section'] : 'IT';

// REC.No may be changed by ADMIN only; for owners it is ignored (keeps existing).
// A duplicate is allowed but flagged back as a warning (saved anyway).
$recNo = $isAdmin ? trim((string)($d['rec_no'] ?? '')) : '';
$warning = null;
if ($recNo !== '') {
    $chk = db()->prepare('SELECT id FROM requests WHERE rec_no = ? AND id <> ?');
    $chk->execute([$recNo, $id]);
    if ($chk->fetch()) $warning = 'เตือน: REC.No ' . $recNo . ' ซ้ำกับใบอื่น (บันทึกแล้ว)';
}

db()->prepare(
    'UPDATE requests SET
        rec_no = COALESCE(NULLIF(?, \'\'), rec_no),
        req_date = ?, for_section = ?, subject = ?, req_name = ?, position = ?,
        section = ?, due_date = ?, detail = ?, picture_path = ?
     WHERE id = ?'
)->execute([
    $recNo,
    ($d['req_date'] ?? '') ?: null,
    $forSection,
    $d['subject']  ?? null,
    $d['req_name'] ?? null,
    $d['position'] ?? null,
    $d['section']  ?? null,
    ($d['due_date'] ?? '') ?: null,
    $d['detail']   ?? null,
    ($d['picture_path'] ?? '') ?: null,
    $id,
]);

json_out(['ok' => true, 'id' => $id, 'warning' => $warning]);
