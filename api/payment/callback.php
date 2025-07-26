<?php
// Script untuk menangani callback dari Midtrans dengan debugging yang lebih baik
// Versi yang diperbarui untuk menggunakan Google Script yang baru

// Fungsi untuk logging
function logDebug($message, $data = null) {
    $logFile = __DIR__ . '/callback_debug.log';
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message";
    
    if ($data !== null) {
        $logMessage .= ": " . json_encode($data, JSON_PRETTY_PRINT);
    }
    
    file_put_contents($logFile, $logMessage . "\n", FILE_APPEND);
}

// Log awal request
logDebug('Callback received');

// Ambil data dari request body
$input = file_get_contents('php://input');
logDebug('Raw input', $input);

// Coba parse sebagai JSON terlebih dahulu
$data = json_decode($input, true);
logDebug('Parsed as JSON', $data);

// Jika bukan JSON, coba parse sebagai query string
if (json_last_error() !== JSON_ERROR_NONE) {
    parse_str($input, $data);
    logDebug('Parsed as query string', $data);
    
    // Jika menggunakan format query string dari Duitku/provider lain
    if (isset($data['merchantOrderId'])) {
        // Konversi format Duitku ke format yang diharapkan
        $data['order_id'] = $data['merchantOrderId'];
        $data['transaction_status'] = ($data['resultCode'] === '00') ? 'settlement' : 'failure';
        logDebug('Converted from Duitku format', $data);
    }
}

// Validasi data
if (!isset($data['order_id']) || !isset($data['transaction_status'])) {
    logDebug('Invalid callback data - missing required fields', $data);
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid callback data']);
    exit;
}

// Verifikasi signature key jika ada
$serverKey = 'SB-Mid-server-mavVN5HEMxI5scqfPoL8r0hA'; // Gunakan server key yang sama dengan create.php
if (isset($data['signature_key'])) {
    $orderId = $data['order_id'];
    $statusCode = $data['status_code'];
    $grossAmount = $data['gross_amount'];
    $input = $orderId.$statusCode.$grossAmount.$serverKey;
    $expectedSignature = hash('sha512', $input);
    
    logDebug('Signature verification', [
        'received' => $data['signature_key'],
        'expected' => $expectedSignature,
        'match' => ($data['signature_key'] === $expectedSignature)
    ]);
    
    if ($data['signature_key'] !== $expectedSignature) {
        logDebug('Invalid signature', $data);
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Invalid signature']);
        exit;
    }
}

// Konversi status ke format yang sesuai dengan Google Sheets
$paymentStatus = 'UNKNOWN';
switch ($data['transaction_status']) {
    case 'capture':
    case 'settlement':
        $paymentStatus = 'SUKSES';
        break;
    case 'pending':
        $paymentStatus = 'PENDING';
        break;
    case 'deny':
    case 'cancel':
    case 'expire':
    case 'failure':
        $paymentStatus = 'FAILED';
        break;
    default:
        $paymentStatus = 'UNKNOWN';
        break;
}

logDebug('Converted payment status', [
    'original' => $data['transaction_status'],
    'converted' => $paymentStatus
]);

// Data untuk Google Sheets
$sheetsData = [
    'order_id' => $data['order_id'], // order_id adalah invoice number
    'transaction_id' => $data['transaction_id'] ?? '',
    'transaction_status' => $data['transaction_status'],
    'status' => $paymentStatus
];

logDebug('Prepared data for Google Sheets', $sheetsData);

// Kirim data ke Google Sheets - PERBARUI URL INI SETELAH DEPLOY ULANG GOOGLE SCRIPT
$scriptURL = 'https://script.google.com/macros/s/AKfycbxdcHTvRT40C0AmJKpzSkIo1TGjhaFYE7vtl3v6OqOg3dmAZLx204LiVIRkbHxaAs4P/exec';

logDebug('Sending data to Google Sheets', [
    'url' => $scriptURL,
    'data' => $sheetsData
]);

$ch = curl_init($scriptURL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($sheetsData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);

// Tambahkan opsi untuk debugging detail
curl_setopt($ch, CURLOPT_VERBOSE, true);
$verbose = fopen('php://temp', 'w+');
curl_setopt($ch, CURLOPT_STDERR, $verbose);

// Tambahkan timeout yang cukup
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

// Tambahkan opsi SSL jika diperlukan
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

// Log informasi debug
rewind($verbose);
$verboseLog = stream_get_contents($verbose);

logDebug('cURL response', [
    'http_code' => $httpCode,
    'response' => $response,
    'error' => $error
]);

logDebug('cURL verbose log', $verboseLog);

curl_close($ch);

if ($error) {
    logDebug('Error updating payment status', $error);
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to update payment status: ' . $error]);
    exit;
}

// Parse response
$responseData = json_decode($response, true);
logDebug('Parsed response', $responseData);

// Check if the update was successful
if (isset($responseData['status']) && $responseData['status'] === 'success') {
    logDebug('Payment status updated successfully');
    echo json_encode(['status' => 'success', 'message' => 'Payment status updated successfully']);
} else {
    logDebug('Failed to update payment status', $responseData);
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to update payment status: ' . ($responseData['message'] ?? 'Unknown error')]);
}