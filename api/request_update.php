<?php
require_once __DIR__ . '/_init.php';
require_method('POST');
$user = require_login();

// only engineers/admins may fill the engineer (page 2) section
if (!in_array($user['role'], ['engineer','admin'], true))
    json_out(['error' => 'forbidden'], 403);

$d  = body();
$id = (int)($d['id'] ?? 0);
if (!$id) json_out(['error' => 'missing id'], 422);

// engineers (ช่าง) may only view IT-section jobs — those belong to IT staff/admin
if ($user['role'] === 'engineer') {
    $own = db()->prepare('SELECT for_section FROM requests WHERE id = ?');
    $own->execute([$id]);
    $cur = $own->fetch(PDO::FETCH_ASSOC);
    if (!$cur) json_out(['error' => 'not found'], 404);
    if ($cur['for_section'] === 'IT') json_out(['error' => 'ใบ section IT — ช่างแก้ไขไม่ได้'], 403);
}

$flag = in_array(($d['schedule_flag'] ?? ''), ['on_schedule','no_schedule'], true)
        ? $d['schedule_flag'] : null;
$status = in_array(($d['status'] ?? ''), ['pending','receive','waiting','finish','cancel'], true)
        ? $d['status'] : 'receive';

// optional: engineer may also set which section handled it + attach a PDF.
// COALESCE keeps the existing value when the key is omitted (so the popup and
// the full form can each send only the fields they own).
$forSection = array_key_exists('for_section', $d)
    ? (in_array($d['for_section'], ['IT','Production Engineer'], true) ? $d['for_section'] : null)
    : null;
$pdfPath = array_key_exists('pdf_path', $d) ? (($d['pdf_path'] ?? '') ?: null) : null;
$pdfGiven = array_key_exists('pdf_path', $d) ? 1 : 0;   // distinguish "clear" vs "leave"

$stmt = db()->prepare(
    'UPDATE requests SET
        operation_detail = ?, date_received = ?, schedule_date = ?, finish_date = ?,
        schedule_flag = ?, schedule_cause = ?, result_status = ?, status = ?,
        for_section = COALESCE(?, for_section),
        pdf_path = CASE WHEN ? = 1 THEN ? ELSE pdf_path END
     WHERE id = ?'
);
$stmt->execute([
    $d['operation_detail'] ?? null,
    ($d['date_received'] ?? '') ?: null,
    ($d['schedule_date']  ?? '') ?: null,
    ($d['finish_date']    ?? '') ?: null,
    $flag,
    $d['schedule_cause'] ?? null,
    $d['result_status']  ?? null,
    $status,
    $forSection,
    $pdfGiven, $pdfPath,
    $id,
]);

// REC.No may be changed by ADMIN only (duplicates allowed but warned)
$warning = null;
if ($user['role'] === 'admin' && array_key_exists('rec_no', $d)) {
    $recNo = trim((string)$d['rec_no']);
    if ($recNo !== '') {
        $chk = db()->prepare('SELECT 1 FROM requests WHERE rec_no = ? AND id <> ? LIMIT 1');
        $chk->execute([$recNo, $id]);
        if ($chk->fetch()) $warning = 'เตือน: REC.No ' . $recNo . ' ซ้ำกับใบอื่น (บันทึกแล้ว)';
        db()->prepare('UPDATE requests SET rec_no = ? WHERE id = ?')->execute([$recNo, $id]);
    }
}

// replace equipment rows
if (isset($d['equipment']) && is_array($d['equipment'])) {
    db()->prepare('DELETE FROM request_equipment WHERE request_id = ?')->execute([$id]);
    $eq = db()->prepare('INSERT INTO request_equipment (request_id, seq, item, qty) VALUES (?,?,?,?)');
    $i = 0;
    foreach ($d['equipment'] as $row) {
        $item = trim((string)($row['item'] ?? ''));
        $qty  = trim((string)($row['qty'] ?? ''));
        if ($item === '' && $qty === '') continue;
        $eq->execute([$id, ++$i, $item, $qty]);
    }
}

// notify the requester about status change
try {
    $req = db()->prepare('SELECT created_by, rec_no FROM requests WHERE id = ?');
    $req->execute([$id]);
    $reqRow = $req->fetch(PDO::FETCH_ASSOC);
    if ($reqRow && !empty($reqRow['created_by']) && (int)$reqRow['created_by'] !== (int)$user['id']) {
        $statusTh = [
            'pending'  => 'รอดำเนินการ',
            'receive'  => 'รับเรื่องแล้ว',
            'waiting'  => 'รอ',
            'finish'   => 'เสร็จแล้ว',
            'cancel'   => 'ยกเลิก',
        ];
        $msg = 'งานของคุณ ' . $reqRow['rec_no'] . ' อัปเดตสถานะเป็น: ' . ($statusTh[$status] ?? $status);
        db()->prepare('INSERT INTO notifications (user_id, request_id, message) VALUES (?,?,?)')
            ->execute([$reqRow['created_by'], $id, $msg]);
    }
} catch (Throwable $e) { /* non-critical */ }

json_out(['ok' => true, 'warning' => $warning]);
