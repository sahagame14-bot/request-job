<?php
require_once __DIR__ . '/_init.php';
require_method('POST');
$user = require_login();

$d = body();
$pdo = db();
$pdo->beginTransaction();
try {
    // ----- generate REC.No  (RJE-{YEAR}{4-digit seq}) -----
    // Self-healing & atomic: advance the counter to at least the highest
    // existing rec_no for the year, so seeded/direct-inserted rows never collide.
    $year = (int) date('Y');
    $like = 'RJE-' . $year . '%';
    $pdo->prepare('INSERT INTO rec_counter (year, last_seq) VALUES (?,0)
                   ON DUPLICATE KEY UPDATE year = year')->execute([$year]);
    $pdo->prepare(
        'UPDATE rec_counter
            SET last_seq = GREATEST(
                  last_seq,
                  COALESCE((SELECT MAX(CAST(SUBSTRING(rec_no, 9) AS UNSIGNED))
                              FROM requests WHERE rec_no LIKE ?), 0)
                ) + 1
          WHERE year = ?'
    )->execute([$like, $year]);
    $seq = (int) $pdo->query('SELECT last_seq FROM rec_counter WHERE year = ' . $year)
                     ->fetchColumn();
    $recNo = sprintf('RJE-%d%04d', $year, $seq);

    // ----- page-2 (engineer) fields — only honoured for engineer/admin creators,
    //       so an engineer can fill the whole single-A4 form in one pass -----
    $canEng = in_array($user['role'], ['engineer', 'admin'], true);
    $flag   = ($canEng && in_array(($d['schedule_flag'] ?? ''), ['on_schedule','no_schedule'], true))
              ? $d['schedule_flag'] : null;
    $status = ($canEng && in_array(($d['status'] ?? ''), ['pending','receive','waiting','finish','cancel'], true))
              ? $d['status'] : 'pending';

    // ----- insert request -----
    $stmt = $pdo->prepare(
        'INSERT INTO requests
           (rec_no, req_date, for_section, subject, req_name, position, section,
            due_date, detail, picture_path,
            operation_detail, date_received, schedule_date, finish_date,
            schedule_flag, schedule_cause, result_status,
            status, created_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    );
    $stmt->execute([
        $recNo,
        ($d['req_date']    ?? '') ?: null,
        $d['for_section'] ?? 'IT',
        $d['subject']     ?? null,
        $d['req_name']    ?? null,
        $d['position']    ?? null,
        $d['section']     ?? null,
        ($d['due_date']    ?? '') ?: null,
        $d['detail']      ?? null,
        ($d['picture_path'] ?? '') ?: null,
        $canEng ? ($d['operation_detail'] ?? null)        : null,
        $canEng ? (($d['date_received'] ?? '') ?: null)   : null,
        $canEng ? (($d['schedule_date']  ?? '') ?: null)  : null,
        $canEng ? (($d['finish_date']    ?? '') ?: null)  : null,
        $flag,
        $canEng ? ($d['schedule_cause'] ?? null)          : null,
        $canEng ? ($d['result_status']  ?? null)          : null,
        $status,
        $user['id'],
    ]);
    $reqId = (int) $pdo->lastInsertId();

    // ----- equipment rows (skip empties) -----
    if (!empty($d['equipment']) && is_array($d['equipment'])) {
        $eq = $pdo->prepare('INSERT INTO request_equipment (request_id, seq, item, qty) VALUES (?,?,?,?)');
        $i = 0;
        foreach ($d['equipment'] as $row) {
            $item = trim((string)($row['item'] ?? ''));
            $qty  = trim((string)($row['qty'] ?? ''));
            if ($item === '' && $qty === '') continue;
            $eq->execute([$reqId, ++$i, $item, $qty]);
        }
    }

    $pdo->commit();

    // notify all engineers & admins about the new job
    try {
        $engineers = db()->query("SELECT id FROM users WHERE role IN ('engineer','admin')")
                         ->fetchAll(PDO::FETCH_COLUMN);
        $ins = db()->prepare('INSERT INTO notifications (user_id, request_id, message) VALUES (?,?,?)');
        $subject = trim((string)($d['subject'] ?? ''));
        $msg = 'งานใหม่: ' . $recNo . ($subject !== '' ? ' — ' . mb_substr($subject, 0, 60) : '');
        foreach ($engineers as $uid) {
            if ((int)$uid !== (int)$user['id']) {
                $ins->execute([$uid, $reqId, $msg]);
            }
        }
    } catch (Throwable $e) { /* notifications are non-critical */ }

    json_out(['ok' => true, 'id' => $reqId, 'rec_no' => $recNo]);
} catch (Throwable $e) {
    $pdo->rollBack();
    json_out(['error' => 'บันทึกไม่สำเร็จ: ' . $e->getMessage()], 500);
}
