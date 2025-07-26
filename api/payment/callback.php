<?php
// Log callback untuk debugging
file_put_contents('callback_log.txt', date('Y-m-d H:i:s') . ' - ' . file_get_contents('php://input') . "\n", FILE_APPEND);

// Ambil data dari request body
$input = file_get_contents('php://input');

// Coba parse sebagai JSON terlebih dahulu
$data = json_decode($input, true);

// Jika bukan JSON, coba parse sebagai query string
if (json_last_error() !== JSON_ERROR_NONE) {
    parse_str($input, $data);
    
    // Jika menggunakan format query string dari Duitku/provider lain
    if (isset($data['merchantOrderId'])) {
        // Konversi format Duitku ke format yang diharapkan
        $data['order_id'] = $data['merchantOrderId'];
        $data['transaction_status'] = ($data['resultCode'] === '00') ? 'settlement' : 'failure';
    }
}

// Validasi data
if (!isset($data['order_id']) || !isset($data['transaction_status'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid callback data']);
    exit;
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

// Kirim data ke Google Sheets - Gunakan URL yang sama dengan create.php
$scriptURL = 'https://script.google.com/macros/s/AKfycbzDuMd8m0EwZ4EbT1UJljWIBYYUhlxgowoz9Vv0GmhfDTfr5pgOhKyvTAiyM6ZX9tb9/exec';

$ch = curl_init($scriptURL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($sheetsData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);

$response = curl_exec($ch);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to update payment status: ' . $error]);
    exit;
}

echo json_encode(['status' => 'success', 'message' => 'Payment status updated successfully']);