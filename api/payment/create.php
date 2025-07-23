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
    case 'paket_premium':
        $price = 47500; // Diubah dari 49000
        break;
    case 'paket_lengkap':
        $price = 36300; // Diubah dari 99000
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

// Untuk paket berbayar, gunakan Duitku Payment Gateway
$merchantCode = 'DS24083'; // Kode merchant dari Duitku
$apiKey = '321bd9c8c95ae5e5f9cf056c61321eff'; // API key dari Duitku

// Format nomor telepon
$formattedPhone = formatPhoneNumber($data['phone']);

// Generate signature
$datetime = date('Y-m-d H:i:s');
$signature = md5($merchantCode . $invoiceNumber . $price . $apiKey);

// Data untuk Duitku
$duitkuData = [
    'merchantCode' => $merchantCode,
    'paymentAmount' => $price,
    'merchantOrderId' => $invoiceNumber,
    'productDetails' => 'Pembelian ' . $data['package'],
    'customerVaName' => $data['name'],
    'email' => $data['email'],
    'phoneNumber' => $formattedPhone,
    // Hapus baris berikut jika ingin pelanggan memilih metode pembayaran
    // 'paymentMethod' => 'SP', // Tambahkan ini untuk QRIS
    'itemDetails' => [
        [
            'name' => 'Pembelian ' . $data['package'],
            'price' => $price,
            'quantity' => 1
        ]
    ],
    'callbackUrl' => 'https://' . $_SERVER['HTTP_HOST'] . '/api/index.php?path=payment/callback',
    'returnUrl' => 'https://' . $_SERVER['HTTP_HOST'] . '?status=success',
    'expiryPeriod' => 1440, // dalam menit (24 jam)
    'signature' => $signature
];

// Kirim request ke Duitku
$ch = curl_init('https://api-sandbox.duitku.com/api/merchant/createInvoice');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($duitkuData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
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

// Log respons dari Duitku
logError('Duitku Response: ' . $response);

$duitkuResponse = json_decode($response, true);

if (isset($duitkuResponse['paymentUrl']) && isset($duitkuResponse['reference'])) {
    // Data untuk Google Sheets
    $sheetsData = [
        'name' => $data['name'],
        'phone' => $formattedPhone,
        'email' => $data['email'],
        'package' => $data['package'],
        'idinvoice' => $duitkuResponse['reference'], // Reference dari Duitku
        'invoice' => $invoiceNumber,
        'harga' => $price,
        'status' => 'PENDING',
        'invoice_url' => $duitkuResponse['paymentUrl']
    ];
    
    // Kirim data ke Google Sheets
    $result = saveToGoogleSheets($sheetsData);
    
    echo json_encode([
        'status' => 'success', 
        'payment_url' => $duitkuResponse['paymentUrl'],
        'reference' => $duitkuResponse['reference']
    ]);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to create payment', 'details' => $duitkuResponse]);
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