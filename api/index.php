<?php
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
    default:
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Endpoint not found']);
        break;
}