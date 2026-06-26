<?php
require_once __DIR__ . '/_init.php';
require_login();

// Peek the next REC.No (does NOT advance the counter — it's only a suggestion the
// requester can keep or edit). Same formula the atomic generator uses on create.
// REC.No format: RJE-{YEAR}{MONTH 2 หลัก}{SEQ 3 หลัก} เช่น RJE-202606044  (seq รายปี รีเซ็ตตอนขึ้นปีใหม่)
// SUBSTRING รู้ความยาว: เลขเก่า len 12 (RJE-YYYYNNNN) → ตัดจากตำแหน่ง 9 / เลขใหม่ len 13+ (RJE-YYYYMMNNN) → ตัดจาก 11
$year  = (int) date('Y');
$month = (int) date('m');
$like  = 'RJE-' . $year . '%';
$stmt = db()->prepare(
    'SELECT GREATEST(
        COALESCE((SELECT last_seq FROM rec_counter WHERE year = ?), 0),
        COALESCE((SELECT MAX(CAST(SUBSTRING(rec_no, IF(LENGTH(rec_no) >= 13, 11, 9)) AS UNSIGNED))
                    FROM requests WHERE rec_no LIKE ?), 0)
     ) + 1 AS nextseq'
);
$stmt->execute([$year, $like]);
$seq = (int) $stmt->fetchColumn();

json_out(['rec_no' => sprintf('RJE-%d%02d%03d', $year, $month, $seq)]);
