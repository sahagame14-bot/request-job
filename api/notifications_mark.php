<?php
require_once __DIR__ . '/_init.php';
require_method('POST');
$user = require_login();
$d = body();

if (!empty($d['all'])) {
    db()->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?')
       ->execute([$user['id']]);
} elseif (!empty($d['id']) && !empty($d['dismiss'])) {
    // ✕ dismiss — remove the notification for this user
    db()->prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?')
       ->execute([(int)$d['id'], $user['id']]);
} elseif (!empty($d['id'])) {
    db()->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
       ->execute([(int)$d['id'], $user['id']]);
}

json_out(['ok' => true]);
