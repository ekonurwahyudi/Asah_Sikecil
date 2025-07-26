<?php
// Log callback untuk debugging
file_put_contents('callback_log.txt', date('Y-m-d H:i:s') . ' - ' . file_get_contents('php://input') . "\n", FILE_APPEND);

// Ambil data dari request body
$input = file_get_contents('php://input');

// Log input mentah untuk debugging
file_put_contents('callback_raw.txt', date('Y-m-d H:i:s') . ' - RAW INPUT: ' . $input . "\n", FILE_APPEND);

// Coba parse sebagai JSON terlebih dahulu
$data = json_decode($input, true);

// Log hasil parsing JSON
file_put_contents('callback_parsed.txt', date('Y-m-d H:i:s') . ' - PARSED JSON: ' . json_encode($data) . "\n", FILE_APPEND);

// Jika bukan JSON, coba parse sebagai query string
if (json_last_error() !== JSON_ERROR_NONE) {
    parse_str($input, $data);
    
    // Log hasil parsing query string
    file_put_contents('callback_parsed.txt', date('Y-m-d H:i:s') . ' - PARSED QUERY: ' . json_encode($data) . "\n", FILE_APPEND);
    
    // Jika menggunakan format query string dari Duitku/provider lain
    if (isset($data['merchantOrderId'])) {
        // Konversi format Duitku ke format yang diharapkan
        $data['order_id'] = $data['merchantOrderId'];
        $data['transaction_status'] = ($data['resultCode'] === '00') ? 'settlement' : 'failure';
    }
}

// Validasi data
if (!isset($data['order_id']) || !isset($data['transaction_status'])) {
    file_put_contents('callback_error.txt', date('Y-m-d H:i:s') . ' - ERROR: Invalid callback data - ' . json_encode($data) . "\n", FILE_APPEND);
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
    
    if ($data['signature_key'] !== $expectedSignature) {
        file_put_contents('callback_error.txt', date('Y-m-d H:i:s') . ' - ERROR: Invalid signature - ' . json_encode($data) . "\n", FILE_APPEND);
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
        $paymentStatus = 'SUKSES'; // Ubah dari SUCCESS menjadi SUKSES
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

// Data untuk Google Sheets
$sheetsData = [
    'order_id' => $data['order_id'], // order_id adalah invoice number
    'transaction_id' => $data['transaction_id'] ?? '',
    'transaction_status' => $data['transaction_status'],
    'gross_amount' => $data['gross_amount'] ?? $data['amount'] ?? '',
    'payment_type' => $data['payment_type'] ?? $data['paymentCode'] ?? '',
    'status' => $paymentStatus
];

// Log data yang akan dikirim ke Google Sheets
file_put_contents('callback_sheets_data.txt', date('Y-m-d H:i:s') . ' - SHEETS DATA: ' . json_encode($sheetsData) . "\n", FILE_APPEND);

// Kirim data ke Google Sheets - Gunakan URL yang sama dengan create.php
$scriptURL = 'https://script.google.com/macros/s/AKfycbxl850FJ1IIBplIT83l4ayL_wTNZ9fcSeChCRzf7FNh0eDWt2QLaWAzASy44OdyjJFa/exec';

$ch = curl_init($scriptURL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($sheetsData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);

// Tambahkan opsi untuk debugging
curl_setopt($ch, CURLOPT_VERBOSE, true);
$verbose = fopen('php://temp', 'w+');
curl_setopt($ch, CURLOPT_STDERR, $verbose);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// Log informasi debug
rewind($verbose);
$verboseLog = stream_get_contents($verbose);
file_put_contents('callback_curl.txt', date('Y-m-d H:i:s') . ' - CURL: HTTP ' . $httpCode . "\nResponse: " . $response . "\nError: " . $error . "\nVerbose: " . $verboseLog . "\n", FILE_APPEND);

if ($error) {
    file_put_contents('callback_error.txt', date('Y-m-d H:i:s') . ' - ERROR: ' . $error . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to update payment status: ' . $error]);
    exit;
}

echo json_encode(['status' => 'success', 'message' => 'Payment status updated successfully']);