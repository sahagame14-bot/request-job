<?php
require_once __DIR__ . '/_init.php';
$user = require_login();
json_out(['user' => $user]);
