<?php
// Log callback untuk debugging
file_put_contents('callback_log.txt', date('Y-m-d H:i:s') . ' - ' . file_get_contents('php://input') . "\n", FILE_APPEND);

// Ambil data dari request body
$data = json_decode(file_get_contents('php://input'), true);

// Validasi data
if (!isset($data['bill_id']) || !isset($data['status'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid callback data']);
    exit;
}

// Konversi status Flip ke format yang sesuai dengan Google Sheets
$paymentStatus = 'UNKNOWN';
switch ($data['status']) {
    case 'SUCCESSFUL':
        $paymentStatus = 'SUCCESS';
        break;
    case 'FAILED':
        $paymentStatus = 'FAILED';
        break;
    case 'PENDING':
        $paymentStatus = 'PENDING';
        break;
    default:
        $paymentStatus = $data['status'];
        break;
}

// Data untuk Google Sheets
$sheetsData = [
    'update_status' => true,
    'invoice' => $data['external_id'], // external_id adalah invoice number
    'status' => $paymentStatus,
    'bill_id' => $data['bill_id']
];

// Kirim data ke Google Sheets
$scriptURL = 'https://script.google.com/macros/s/AKfycbyZ-UO3ns123R7ruN2RMJ2knepoaNnILgUoby0-4yOVO3f_tjOiWFSF8XoGTRk2oYO3/exec';

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