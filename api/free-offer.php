<?php
// Pastikan request method adalah POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Ambil data dari request body
$data = json_decode(file_get_contents('php://input'), true);

// Validasi data
if (!isset($data['name']) || !isset($data['phone']) || !isset($data['email']) || !isset($data['city'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

// Format nomor telepon
$formattedPhone = $data['phone'];

// Jika nomor dimulai dengan '08', ubah menjadi '628'
if (strpos($formattedPhone, '08') === 0) {
    $formattedPhone = '62' . substr($formattedPhone, 1);
}
// Jika nomor dimulai dengan '8', tambahkan '62' di depan
elseif (strpos($formattedPhone, '8') === 0) {
    $formattedPhone = '62' . $formattedPhone;
}
// Jika nomor dimulai dengan '+62', hapus '+'
elseif (strpos($formattedPhone, '+62') === 0) {
    $formattedPhone = substr($formattedPhone, 1);
}

// Perbarui nomor telepon yang sudah diformat
$data['phone'] = $formattedPhone;

// Ambil URL Google Apps Script dari config
require_once __DIR__ . '/config.php';
$scriptURL = $config['google_sheets']['script_url'];

// Kirim data ke Google Sheets
$ch = curl_init($scriptURL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);

// Tambahkan timeout yang cukup
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

// Nonaktifkan SSL verification jika diperlukan (untuk development)
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$response = curl_exec($ch);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to save data: ' . $error]);
    exit;
}

echo json_encode(['status' => 'success', 'message' => 'Data saved successfully']);