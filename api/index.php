<?php
require_once 'config.php';
require_once 'rate_limit.php';

// Batasi CORS hanya ke domain yang diizinkan
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Origin");

// Jika request method adalah OPTIONS, kembalikan response sukses
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success']);
    exit;
}

// Routing sederhana
$path = isset($_GET['path']) ? $_GET['path'] : '';

switch ($path) {
    case 'payment/create':
        require_once 'payment/create.php';
        break;
    case 'payment/callback':
        require_once 'payment/callback.php';
        break;
    case 'save-data':
        require_once 'save-data.php';
        break;
    case 'free-offer':
        require_once 'free-offer.php';
        break;
    default:
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Endpoint not found']);
        break;
}

// Cek rate limit untuk endpoint sensitif
if (in_array($path, ['payment/create', 'payment/callback'])) {
    $ip = $_SERVER['REMOTE_ADDR'];
    if (!checkRateLimit($ip, $path, 30, 60)) { // 30 requests per 60 seconds
        http_response_code(429);
        echo json_encode(['status' => 'error', 'message' => 'Too many requests']);
        exit;
    }
}
