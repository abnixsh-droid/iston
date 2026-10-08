<?php

declare(strict_types=1);

header('Content-Type: application/json');

$SHARED_KEY = 'CHANGE_THIS_STRONG_KEY';

if (($_SERVER['HTTP_X_UPLOAD_KEY'] ?? '') !== $SHARED_KEY) {
    http_response_code(401);
    echo json_encode([
        'ok' => false,
        'error' => 'unauthorized'
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'ok' => false,
        'error' => 'method_not_allowed'
    ]);
    exit;
}

$path = $_POST['path'] ?? '';

if (!$path || !str_starts_with($path, '/uploads/')) {
    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'error' => 'bad_path'
    ]);
    exit;
}

$full = __DIR__ . '/..' . $path;

if (!file_exists($full)) {
    echo json_encode([
        'ok' => true,
        'deleted' => false
    ]);
    exit;
}

if (!unlink($full)) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'unlink_failed'
    ]);
    exit;
}

echo json_encode([
    'ok' => true,
    'deleted' => true
]);
