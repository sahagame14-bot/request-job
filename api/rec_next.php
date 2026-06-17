<?php
require_once __DIR__ . '/_init.php';
require_login();

// Peek the next REC.No (does NOT advance the counter — it's only a suggestion the
// requester can keep or edit). Same formula the atomic generator uses on create.
$year = (int) date('Y');
$like = 'RJE-' . $year . '%';
$stmt = db()->prepare(
    'SELECT GREATEST(
        COALESCE((SELECT last_seq FROM rec_counter WHERE year = ?), 0),
        COALESCE((SELECT MAX(CAST(SUBSTRING(rec_no, 9) AS UNSIGNED))
                    FROM requests WHERE rec_no LIKE ?), 0)
     ) + 1 AS nextseq'
);
$stmt->execute([$year, $like]);
$seq = (int) $stmt->fetchColumn();

json_out(['rec_no' => sprintf('RJE-%d%04d', $year, $seq)]);
