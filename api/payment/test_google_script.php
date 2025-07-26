<?php
// Script untuk menguji Google Script secara langsung

// Fungsi untuk mendapatkan semua invoice dari Google Sheet
function getAllInvoices() {
    $scriptURL = 'https://script.google.com/macros/s/AKfycbzDuMd8m0EwZ4EbT1UJljWIBYYUhlxgowoz9Vv0GmhfDTfr5pgOhKyvTAiyM6ZX9tb9/exec';
    
    // Data untuk mendapatkan semua invoice
    $data = [
        'action' => 'get_all_invoices'
    ];
    
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
        return ['status' => 'error', 'message' => $error];
    }
    
    return json_decode($response, true);
}

// Fungsi untuk memperbarui status invoice
function updateInvoiceStatus($orderId, $transactionId, $status) {
    $scriptURL = 'https://script.google.com/macros/s/AKfycbzDuMd8m0EwZ4EbT1UJljWIBYYUhlxgowoz9Vv0GmhfDTfr5pgOhKyvTAiyM6ZX9tb9/exec';
    
    // Data untuk memperbarui status invoice
    $data = [
        'order_id' => $orderId,
        'transaction_id' => $transactionId,
        'transaction_status' => $status === 'SUKSES' ? 'settlement' : ($status === 'PENDING' ? 'pending' : 'failure'),
        'status' => $status
    ];
    
    $ch = curl_init($scriptURL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
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
    
    return [
        'status' => $error ? 'error' : 'success',
        'http_code' => $httpCode,
        'response' => $response,
        'error' => $error,
        'verbose' => $verboseLog
    ];
}

// Tampilkan form
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Dapatkan semua invoice
    $invoices = getAllInvoices();
    
    echo "<h1>Test Google Script</h1>";
    
    // Form untuk memperbarui status invoice
    echo "<h2>Update Invoice Status</h2>";
    echo "<form method='post'>";
    echo "<div>";
    echo "<label for='order_id'>Order ID:</label>";
    echo "<input type='text' name='order_id' id='order_id' required>";
    echo "</div>";
    echo "<div>";
    echo "<label for='transaction_id'>Transaction ID:</label>";
    echo "<input type='text' name='transaction_id' id='transaction_id' value='test-transaction-id-" . time() . "'>";
    echo "</div>";
    echo "<div>";
    echo "<label for='status'>Status:</label>";
    echo "<select name='status' id='status'>";
    echo "<option value='SUKSES'>SUKSES</option>";
    echo "<option value='PENDING'>PENDING</option>";
    echo "<option value='FAILED'>FAILED</option>";
    echo "</select>";
    echo "</div>";
    echo "<button type='submit'>Update Status</button>";
    echo "</form>";
    
    // Tampilkan semua invoice
    echo "<h2>All Invoices</h2>";
    if (isset($invoices['status']) && $invoices['status'] === 'error') {
        echo "<p>Error: " . $invoices['message'] . "</p>";
    } else {
        echo "<p>Tidak dapat mendapatkan daftar invoice. Fitur ini memerlukan modifikasi pada Google Script.</p>";
        echo "<p>Silakan masukkan Order ID secara manual berdasarkan data di Google Sheet.</p>";
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Perbarui status invoice
    $orderId = $_POST['order_id'] ?? '';
    $transactionId = $_POST['transaction_id'] ?? '';
    $status = $_POST['status'] ?? 'SUKSES';
    
    $result = updateInvoiceStatus($orderId, $transactionId, $status);
    
    echo "<h1>Update Result</h1>";
    echo "<h2>Request Data:</h2>";
    echo "<pre>" . json_encode([
        'order_id' => $orderId,
        'transaction_id' => $transactionId,
        'status' => $status
    ], JSON_PRETTY_PRINT) . "</pre>";
    
    echo "<h2>HTTP Status Code:</h2>";
    echo "<pre>" . $result['http_code'] . "</pre>";
    
    echo "<h2>Response:</h2>";
    echo "<pre>" . $result['response'] . "</pre>";
    
    if ($result['error']) {
        echo "<h2>Error:</h2>";
        echo "<pre>" . $result['error'] . "</pre>";
    }
    
    echo "<h2>Verbose Log:</h2>";
    echo "<pre>" . $result['verbose'] . "</pre>";
    
    echo "<p><a href='test_google_script.php'>Back to Form</a></p>";
}