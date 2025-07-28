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
    case 'paket_premium':
        $price = 49600;
        break;
    case 'paket_lengkap':
        $price = 36300;
        break;
    case 'paket_free':
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

// Tambahkan di awal file, setelah error reporting
require_once __DIR__ . '/../config.php';

// Untuk paket berbayar, gunakan Midtrans Snap
$merchantId = $config['midtrans']['merchant_id'];
$clientKey = $config['midtrans']['client_key'];
$serverKey = $config['midtrans']['server_key'];

// Format nomor telepon
$formattedPhone = formatPhoneNumber($data['phone']);

// Data untuk Midtrans Snap
$midtransData = [
    'transaction_details' => [
        'order_id' => $invoiceNumber,
        'gross_amount' => $price
    ],
    'customer_details' => [
        'first_name' => $data['name'],
        'email' => $data['email'],
        'phone' => $formattedPhone
    ],
    'item_details' => [
        [
            'id' => $data['package'],
            'price' => $price,
            'quantity' => 1,
            'name' => 'Pembelian ' . $data['package']
        ]
    ],
    'callbacks' => [
        'finish' => 'https://' . $_SERVER['HTTP_HOST'] . '?status=success',
        'notification' => 'https://' . $_SERVER['HTTP_HOST'] . '/api/payment/callback'
    ]
];

// Kirim request ke Midtrans Snap
$ch = curl_init($config['midtrans']['api_url']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($midtransData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json',
    'Authorization: Basic ' . base64_encode($serverKey . ':'),
    'X-Append-Notification: https://' . $_SERVER['HTTP_HOST'] . '/api/payment/callback'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// Log HTTP status dan response
logError('HTTP Status: ' . $httpCode);
logError('Midtrans Response: ' . $response);

if ($error) {
    logError('cURL Error: ' . $error);
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to create payment: ' . $error]);
    exit;
}

// Cek HTTP status code
if ($httpCode !== 200 && $httpCode !== 201) {
    logError('HTTP Error: Status code ' . $httpCode);
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Midtrans API returned HTTP ' . $httpCode, 'details' => $response]);
    exit;
}

$midtransResponse = json_decode($response, true);

if (isset($midtransResponse['token']) && isset($midtransResponse['redirect_url'])) {
    // Data untuk Google Sheets
    $sheetsData = [
        'name' => $data['name'],
        'phone' => $formattedPhone,
        'email' => $data['email'],
        'package' => $data['package'],
        'idinvoice' => $midtransResponse['token'], // Token dari Midtrans
        'invoice' => $invoiceNumber,
        'harga' => $price,
        'status' => 'PENDING',
        'invoice_url' => $midtransResponse['redirect_url']
    ];
    
    // Kirim data ke Google Sheets
    $result = saveToGoogleSheets($sheetsData);
    
    echo json_encode([
        'status' => 'success', 
        'snap_token' => $midtransResponse['token'],
        'redirect_url' => $midtransResponse['redirect_url']
    ]);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to create payment', 'details' => $midtransResponse]);
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
    global $config;
    $scriptURL = $config['google_sheets']['script_url'];
    
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
