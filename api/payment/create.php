<?php
// Aktifkan error reporting dan logging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Tambahkan logging ke file
function logError($message) {
    $logFile = __DIR__ . '/error.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}

// Log awal request
logError('Request started: ' . json_encode($_SERVER));

// Kode yang sudah ada
// Pastikan request method adalah POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Ambil data dari request body
$data = json_decode(file_get_contents('php://input'), true);

// Validasi data
if (!isset($data['name']) || !isset($data['phone']) || !isset($data['email']) || !isset($data['package'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

// Dapatkan harga berdasarkan paket
$price = 0;
switch ($data['package']) {
    case 'premium':
        $price = 49000;
        break;
    case 'lengkap':
        $price = 99000;
        break;
    case 'free':
    default:
        $price = 0;
        break;
}

// Generate invoice number
$invoiceNumber = 'INV-' . time();

// Jika paket free, langsung simpan ke Google Sheets
if ($price === 0) {
    // Format nomor telepon
    $formattedPhone = formatPhoneNumber($data['phone']);
    
    // Data untuk Google Sheets
    $sheetsData = [
        'name' => $data['name'],
        'phone' => $formattedPhone,
        'email' => $data['email'],
        'package' => $data['package'],
        'idinvoice' => '',
        'invoice' => $invoiceNumber,
        'harga' => '0',
        'status' => 'SUKSES'
    ];
    
    // Kirim data ke Google Sheets
    $result = saveToGoogleSheets($sheetsData);
    
    echo json_encode(['status' => 'success', 'message' => 'Free package activated successfully']);
    exit;
}

// Untuk paket berbayar, gunakan Flip Accept Payment
$secretId = 'JDJ5JDEzJDMxYkIvTGxOTzhHVFgwUUwxNEp1Li55T0hQUS5TY0tpeS5UdzNZYTFOazEwOG0xWGVIV3B5';
$validationToken = '$2y$13$wYc07WH479z.pyL7kkirU.0zmjkVMY6Qj93.Ps5it7lx4e5Hh3T5y';

// Format nomor telepon
$formattedPhone = formatPhoneNumber($data['phone']);

// Data untuk Flip
$flipData = [
    'title' => 'Pembelian ' . $data['package'],
    'amount' => $price,
    'type' => 'SINGLE',
    'step' => 2,
    'sender_name' => $data['name'],
    'sender_email' => $data['email'],
    'sender_phone_number' => $formattedPhone,
    'is_open' => true,
    'include_admin_fee' => true,
    'expiration_time' => 24, // dalam jam
    'redirect_url' => 'https://' . $_SERVER['HTTP_HOST'] . '?status=success',
    'is_address_required' => false,
    'payment_method' => 'DIRECT',
    'external_id' => $invoiceNumber
];

// Kirim request ke Flip
$ch = curl_init('https://bigflip.id/api/v3/payment-checkout/create-bill');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($flipData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json',
    'idempotency-key: ' . $invoiceNumber,
    'X-SECRET-ID: ' . $secretId,
    'X-TOKEN-AUTH: ' . $validationToken
]);

$response = curl_exec($ch);
$error = curl_error($ch);
curl_close($ch);

// Dalam blok error handling, tambahkan logging
if ($error) {
    logError('cURL Error: ' . $error);
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to create payment: ' . $error]);
    exit;
}

// Log respons dari Flip
logError('Flip Response: ' . $response);

$flipResponse = json_decode($response, true);

if (isset($flipResponse['link'])) {
    // Data untuk Google Sheets
    $sheetsData = [
        'name' => $data['name'],
        'phone' => $formattedPhone,
        'email' => $data['email'],
        'package' => $data['package'],
        'idinvoice' => $flipResponse['bill_id'],
        'invoice' => $invoiceNumber,
        'harga' => $price,
        'status' => 'PENDING',
        'invoice_url' => $flipResponse['link']
    ];
    
    // Kirim data ke Google Sheets
    $result = saveToGoogleSheets($sheetsData);
    
    echo json_encode([
        'status' => 'success', 
        'payment_url' => $flipResponse['link'],
        'bill_id' => $flipResponse['bill_id']
    ]);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to create payment', 'details' => $flipResponse]);
}

// Fungsi untuk format nomor telepon
function formatPhoneNumber($phone) {
    if (substr($phone, 0, 1) === '0') {
        return '62' . substr($phone, 1);
    } elseif (substr($phone, 0, 2) === '62') {
        return $phone;
    } elseif (substr($phone, 0, 1) === '+') {
        return substr($phone, 1);
    } else {
        return '62' . $phone;
    }
}

// Fungsi untuk menyimpan data ke Google Sheets
function saveToGoogleSheets($data) {
    $scriptURL = 'https://script.google.com/macros/s/AKfycbyZ-UO3ns123R7ruN2RMJ2knepoaNnILgUoby0-4yOVO3f_tjOiWFSF8XoGTRk2oYO3/exec';
    
    $ch = curl_init($scriptURL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    return ['response' => $response, 'error' => $error];
}