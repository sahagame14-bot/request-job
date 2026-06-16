<?php
require_once __DIR__ . '/_init.php';
require_method('POST');
require_login();

if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK)
    json_out(['error' => 'ไม่มีไฟล์ หรืออัปโหลดไม่สำเร็จ'], 422);

$f = $_FILES['file'];

// images (5MB) + PDF documents (10MB) are both accepted
$images = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'];
$docs   = ['application/pdf' => 'pdf'];
$mime = mime_content_type($f['tmp_name']);

if (isset($docs[$mime])) {
    if ($f['size'] > 10 * 1024 * 1024) json_out(['error' => 'ไฟล์ PDF ใหญ่เกิน 10MB'], 422);
    $ext = $docs[$mime]; $prefix = 'doc_';
} elseif (isset($images[$mime])) {
    if ($f['size'] > 5 * 1024 * 1024) json_out(['error' => 'รูปภาพใหญ่เกิน 5MB'], 422);
    $ext = $images[$mime]; $prefix = 'img_';
} else {
    json_out(['error' => 'รองรับเฉพาะรูปภาพ (jpg, png, gif, webp) หรือไฟล์ PDF'], 422);
}

$dir = __DIR__ . '/../uploads';
if (!is_dir($dir)) mkdir($dir, 0775, true);

$name = $prefix . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
if (!move_uploaded_file($f['tmp_name'], "$dir/$name"))
    json_out(['error' => 'บันทึกไฟล์ไม่สำเร็จ'], 500);

json_out(['ok' => true, 'path' => "uploads/$name"]);
