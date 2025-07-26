<?php
// Script untuk menguji callback ke Google Sheets

// Data untuk Google Sheets - simulasi data callback Midtrans
$sheetsData = [
    'order_id' => 'INV-1753526605', // Ganti dengan order_id yang ada di Google Sheets
    'transaction_id' => 'test-transaction-id-' . time(),
    'transaction_status' => 'settlement',
    'gross_amount' => '36300',
    'payment_type' => 'bank_transfer',
    'status' => 'SUKSES'
];

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

// Output hasil
echo "<h1>Test Callback ke Google Sheets</h1>";
echo "<h2>Data yang dikirim:</h2>";
echo "<pre>" . json_encode($sheetsData, JSON_PRETTY_PRINT) . "</pre>";

echo "<h2>HTTP Status Code:</h2>";
echo "<pre>$httpCode</pre>";

echo "<h2>Response:</h2>";
echo "<pre>$response</pre>";

if ($error) {
    echo "<h2>Error:</h2>";
    echo "<pre>$error</pre>";
}

echo "<h2>Verbose Log:</h2>";
echo "<pre>$verboseLog</pre>";