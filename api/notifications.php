<?php
require_once __DIR__ . '/_init.php';
require_method('GET');
$user = require_login();

$stmt = db()->prepare(
    'SELECT n.id, n.request_id, n.message, n.is_read, n.created_at, r.rec_no
     FROM notifications n
     LEFT JOIN requests r ON r.id = n.request_id
     WHERE n.user_id = ?
     ORDER BY n.created_at DESC
     LIMIT 50'
);
$stmt->execute([$user['id']]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$unread = 0;
foreach ($rows as $r) { if (!$r['is_read']) $unread++; }

json_out(['ok' => true, 'notifications' => $rows, 'unread' => (int)$unread]);
