<?php
require_once __DIR__ . '/_init.php';
$user = require_login();

$q      = trim((string)($_GET['q'] ?? ''));
$status = trim((string)($_GET['status'] ?? ''));
$mine   = !empty($_GET['mine']);

// date range (on req_date) + sort direction
$dateFrom = trim((string)($_GET['date_from'] ?? ''));
$dateTo   = trim((string)($_GET['date_to'] ?? ''));
$isYmd = fn($s) => preg_match('/^\d{4}-\d{2}-\d{2}$/', $s) === 1;
if (!$isYmd($dateFrom)) $dateFrom = '';
if (!$isYmd($dateTo))   $dateTo   = '';
$sortDir  = (strtolower((string)($_GET['sort'] ?? 'desc')) === 'asc') ? 'ASC' : 'DESC';
$perPage  = max(1, min(200, (int)($_GET['per_page'] ?? 50)));
$page     = max(1, (int)($_GET['page'] ?? 1));
$offset   = ($page - 1) * $perPage;

$base = 'FROM requests r WHERE 1=1';
$args = [];

// "my reports" page (mine=1) always restricts to own; so do plain users
$ownOnly = $mine || !in_array($user['role'], ['engineer','admin'], true);
if ($ownOnly) {
    $base .= ' AND r.created_by = ?';
    $args[] = $user['id'];
}
if ($q !== '') {
    $base .= ' AND (r.rec_no LIKE ? OR r.subject LIKE ? OR r.req_name LIKE ?)';
    $like = "%$q%"; array_push($args, $like, $like, $like);
}
if ($status !== '') {
    $statusList = array_values(array_filter(array_map('trim', explode(',', $status))));
    if (count($statusList) === 1) {
        $base .= ' AND r.status = ?'; $args[] = $statusList[0];
    } else {
        $ph = implode(',', array_fill(0, count($statusList), '?'));
        $base .= " AND r.status IN ($ph)";
        array_push($args, ...$statusList);
    }
}
if ($dateFrom !== '') { $base .= ' AND r.req_date >= ?'; $args[] = $dateFrom; }
if ($dateTo   !== '') { $base .= ' AND r.req_date <= ?'; $args[] = $dateTo; }

// total matching rows (for pagination)
$cntStmt = db()->prepare("SELECT COUNT(*) $base");
$cntStmt->execute($args);
$total = (int)$cntStmt->fetchColumn();

$sql  = "SELECT r.id, r.rec_no, r.req_date, r.for_section, r.subject,
                r.req_name, r.position, r.section, r.due_date, r.status, r.created_at,
                r.operation_detail, r.date_received, r.schedule_date, r.finish_date,
                r.schedule_flag, r.schedule_cause, r.result_status, r.picture_path, r.pdf_path
         $base ORDER BY r.id $sortDir LIMIT $perPage OFFSET $offset";
$stmt = db()->prepare($sql);
$stmt->execute($args);

// quick counts for dashboard cards
$counts = ['total'=>0,'pending'=>0,'receive'=>0,'waiting'=>0,'finish'=>0,'cancel'=>0];
$cWhere = $ownOnly ? ' WHERE created_by = ' . (int)$user['id'] : '';
foreach (db()->query("SELECT status, COUNT(*) c FROM requests$cWhere GROUP BY status") as $r) {
    $counts['total'] += (int)$r['c'];
    if (isset($counts[$r['status']])) $counts[$r['status']] = (int)$r['c'];
}

json_out([
    'rows'     => $stmt->fetchAll(),
    'counts'   => $counts,
    'role'     => $user['role'],
    'total'    => $total,
    'page'     => $page,
    'per_page' => $perPage,
    'pages'    => (int)ceil($total / $perPage),
]);
