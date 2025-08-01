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
if (!isset($data['name']) || !isset($data['phone']) || !isset($data['email']) || !isset($data['package'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

// URL Google Apps Script
$scriptURL = 'https://script.google.com/macros/s/AKfycbxdcHTvRT40C0AmJKpzSkIo1TGjhaFYE7vtl3v6OqOg3dmAZLx204LiVIRkbHxaAs4P/exec';

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

$response = curl_exec($ch);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to save data: ' . $error]);
    exit;
}

echo json_encode(['status' => 'success', 'message' => 'Data saved successfully']);