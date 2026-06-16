<?php
require_once __DIR__ . '/_init.php';
require_admin();

$rows = db()->query(
    'SELECT u.id, u.name, u.username, u.department, u.role, u.created_at,
            (SELECT COUNT(*) FROM requests r WHERE r.created_by = u.id) AS request_count
       FROM users u
      ORDER BY u.id'
)->fetchAll();

$admins  = 0;
foreach ($rows as $u) if ($u['role'] === 'admin') $admins++;
$records = (int) db()->query('SELECT COUNT(*) FROM requests')->fetchColumn();

json_out([
    'rows'  => $rows,
    'stats' => ['total' => count($rows), 'admins' => $admins, 'records' => $records],
]);
