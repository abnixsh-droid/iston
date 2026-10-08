<?php

declare(strict_types=1);

header('Content-Type: application/json');

// ==========================================
// CONFIG
// ==========================================

// MUST match the VITE_UPLOAD_KEY GitHub secret
$SHARED_KEY = 'CHANGE_THIS_STRONG_KEY';


// ==========================================
// AUTHENTICATION
// ==========================================

if (($_SERVER['HTTP_X_UPLOAD_KEY'] ?? '') !== $SHARED_KEY) {
    http_response_code(401);

    echo json_encode([
        'ok' => false,
        'error' => 'unauthorized'
    ]);

    exit;
}


// ==========================================
// REQUEST METHOD
// ==========================================

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    echo json_encode([
        'ok' => false,
        'error' => 'method_not_allowed'
    ]);

    exit;
}


// ==========================================
// CHECK FILE
// ==========================================

if (!isset($_FILES['file'])) {
    http_response_code(400);

    echo json_encode([
        'ok' => false,
        'error' => 'no_file'
    ]);

    exit;
}

$file = $_FILES['file'];


// ==========================================
// CHECK UPLOAD ERROR
// ==========================================

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);

    echo json_encode([
        'ok' => false,
        'error' => 'upload_error',
        'code' => $file['error']
    ]);

    exit;
}


// ==========================================
// FOLDER
// ==========================================

$relFolder = $_POST['folder'] ?? 'misc';

// Allow only safe folder characters
$relFolder = preg_replace(
    '#[^a-zA-Z0-9/_-]#',
    '',
    $relFolder
);

if ($relFolder === '') {
    $relFolder = 'misc';
}


// ==========================================
// UPLOAD DIRECTORY
// ==========================================

// Production:
// public_html/
// ├── api/
// │   └── upload.php
// └── uploads/
//     └── ...

$uploadRoot = __DIR__ . '/../uploads';

$targetDir = $uploadRoot . '/' . $relFolder;


// ==========================================
// CREATE DIRECTORY
// ==========================================

if (!is_dir($targetDir)) {
    if (!mkdir($targetDir, 0755, true)) {
        http_response_code(500);

        echo json_encode([
            'ok' => false,
            'error' => 'mkdir_failed'
        ]);

        exit;
    }
}


// ==========================================
// FILE SIZE LIMIT
// ==========================================

// 15 MB maximum
$maxSize = 15 * 1024 * 1024;

$size = (int)($file['size'] ?? 0);

if ($size > $maxSize) {
    http_response_code(400);

    echo json_encode([
        'ok' => false,
        'error' => 'file_too_large',
        'max_size' => '15MB'
    ]);

    exit;
}


// ==========================================
// FILE EXTENSION
// ==========================================

$originalName = $file['name'] ?? '';

$ext = strtolower(
    pathinfo($originalName, PATHINFO_EXTENSION)
);


// ==========================================
// ALLOWED FILE TYPES
// ==========================================

$allowed = [
    'jpg',
    'jpeg',
    'png',
    'webp',
    'gif',
    'svg',
    'pdf'
];

if (!in_array($ext, $allowed, true)) {
    http_response_code(400);

    echo json_encode([
        'ok' => false,
        'error' => 'invalid_extension'
    ]);

    exit;
}


// ==========================================
// GENERATE SAFE RANDOM NAME
// ==========================================

try {
    $newName = bin2hex(random_bytes(16)) . '.' . $ext;
} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        'ok' => false,
        'error' => 'filename_generation_failed'
    ]);

    exit;
}


$destination = $targetDir . '/' . $newName;


// ==========================================
// MOVE FILE
// ==========================================

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    http_response_code(500);

    echo json_encode([
        'ok' => false,
        'error' => 'move_failed'
    ]);

    exit;
}


// ==========================================
// PUBLIC URL
// ==========================================

$protocol = (
    (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || ($_SERVER['SERVER_PORT'] ?? '') == 443
)
    ? 'https://'
    : 'http://';

$host = $_SERVER['HTTP_HOST'] ?? 'istongroupbuilder.in';

$publicPath = '/uploads/' . trim(
    $relFolder . '/' . $newName,
    '/'
);

$publicUrl = $protocol . $host . $publicPath;


// ==========================================
// SUCCESS
// ==========================================

echo json_encode([
    'ok' => true,
    'url' => $publicUrl,
    'path' => $publicPath,
    'name' => $newName,
    'size' => $size
]);
