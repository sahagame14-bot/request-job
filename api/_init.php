<?php
/**
 * Shared bootstrap for every API endpoint:
 *  - session, JSON helpers, auth guard, request-body parsing.
 */
declare(strict_types=1);

require_once __DIR__ . '/db.php';

// Never let warnings/notices leak into the JSON body (they are logged instead).
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Harden the session cookie: not readable by JS (HttpOnly), sent only same-site
// (SameSite=Lax mitigates CSRF), and flagged Secure when served over HTTPS.
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Lax',
    'secure'   => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
]);
session_start();
header('Content-Type: application/json; charset=utf-8');

/** Send a JSON response and stop. */
function json_out($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Read & decode the JSON request body (returns []). */
function body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) return [];
    $d = json_decode($raw, true);
    return is_array($d) ? $d : [];
}

/** Current logged-in user id, or null. */
function current_user_id(): ?int {
    return isset($_SESSION['uid']) ? (int) $_SESSION['uid'] : null;
}

/** Guard: require a logged-in user, else 401. Returns the user row. */
function require_login(): array {
    $uid = current_user_id();
    if (!$uid) json_out(['error' => 'unauthorized'], 401);
    $stmt = db()->prepare('SELECT id, name, username, department, role FROM users WHERE id = ?');
    $stmt->execute([$uid]);
    $u = $stmt->fetch();
    if (!$u) { session_destroy(); json_out(['error' => 'unauthorized'], 401); }
    return $u;
}

/** Guard: require an admin, else 403. Returns the user row. */
function require_admin(): array {
    $u = require_login();
    if ($u['role'] !== 'admin') json_out(['error' => 'forbidden'], 403);
    return $u;
}

/** Only allow a given HTTP method. */
function require_method(string $method): void {
    if ($_SERVER['REQUEST_METHOD'] !== $method) json_out(['error' => 'method_not_allowed'], 405);
}

/** Client IP (best effort). */
function client_ip(): string {
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}
