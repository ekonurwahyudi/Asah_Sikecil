<?php
// Script untuk debugging callback

// Simulasi data callback dari Midtrans
$callbackData = [
    'order_id' => 'INV-1753526605',
    'transaction_id' => 'test-transaction-id-' . time(),
    'transaction_status' => 'settlement',
    'gross_amount' => '36300',
    'payment_type' => 'bank_transfer'
];

// Konversi status ke format yang sesuai dengan Google Sheets
$paymentStatus = 'UNKNOWN';
switch ($callbackData['transaction_status']) {
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

// Data untuk Google Sheets
$sheetsData = [
    'order_id' => $callbackData['order_id'],
    'transaction_id' => $callbackData['transaction_id'],
    'transaction_status' => $callbackData['transaction_status'],
    'gross_amount' => $callbackData['gross_amount'],
    'payment_type' => $callbackData['payment_type'],
    'status' => $paymentStatus
];

// Tampilkan data yang akan dikirim
echo "<h1>Debug Callback Data</h1>";
echo "<h2>Data Callback Midtrans:</h2>";
echo "<pre>" . json_encode($callbackData, JSON_PRETTY_PRINT) . "</pre>";

echo "<h2>Data untuk Google Sheets:</h2>";
echo "<pre>" . json_encode($sheetsData, JSON_PRETTY_PRINT) . "</pre>";

// Bandingkan dengan struktur data di Google Script
echo "<h2>Struktur Data di Google Script:</h2>";
echo "<pre>
if (data.transaction_status !== undefined) { 
  // Cari baris dengan invoice number yang sesuai 
  var dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()); 
  var values = dataRange.getValues(); 
  
  // Konversi status Midtrans ke status yang lebih deskriptif
  var paymentStatus = \"UNKNOWN\";
  if (data.transaction_status === \"capture\" || data.transaction_status === \"settlement\") {
    paymentStatus = \"SUKSES\";
  } else if (data.transaction_status === \"pending\") {
    paymentStatus = \"PENDING\";
  } else if (data.transaction_status === \"deny\" || data.transaction_status === \"cancel\" || 
             data.transaction_status === \"expire\" || data.transaction_status === \"failure\") {
    paymentStatus = \"FAILED\";
  }
  
  for (var i = 0; i < values.length; i++) { 
    // Kolom 6 adalah invoice (order_id dari Midtrans) 
    if (values[i][6] === data.order_id) { 
      // Update status di kolom 9 (kolom I) 
      sheet.getRange(i + 2, 9).setValue(paymentStatus); 
      // Update transaction_id di kolom 7 (kolom G) jika ada
      if (data.transaction_id) {
        sheet.getRange(i + 2, 7).setValue(data.transaction_id);
      }
</pre>";

// Tampilkan struktur kolom di Google Sheets
echo "<h2>Struktur Kolom di Google Sheets:</h2>";
echo "<pre>
sheet.appendRow([ 
  new Date(), // Timestamp - Kolom 1 (A)
  data.name,  // Nama - Kolom 2 (B)
  data.phone, // Telepon - Kolom 3 (C)
  data.email, // Email - Kolom 4 (D)
  data.package, // Paket - Kolom 5 (E)
  data.invoice,    // Invoice number (order_id untuk Midtrans) - Kolom 6 (F)
  data.idinvoice,  // transaction_id untuk Midtrans - Kolom 7 (G)
  data.harga, // Harga - Kolom 8 (H)
  data.status, // Status - Kolom 9 (I)
  data.invoice_url // URL Invoice - Kolom 10 (J)
]);
</pre>";

// Tampilkan contoh data di Google Sheets
echo "<h2>Contoh Data di Google Sheets:</h2>";
echo "<table border='1' cellpadding='5'>";
echo "<tr>";
echo "<th>A (Timestamp)</th>";
echo "<th>B (Nama)</th>";
echo "<th>C (Telepon)</th>";
echo "<th>D (Email)</th>";
echo "<th>E (Paket)</th>";
echo "<th>F (Invoice/order_id)</th>";
echo "<th>G (ID Invoice/transaction_id)</th>";
echo "<th>H (Harga)</th>";
echo "<th>I (Status)</th>";
echo "<th>J (URL Invoice)</th>";
echo "</tr>";

echo "<tr>";
echo "<td>" . date('Y-m-d H:i:s') . "</td>";
echo "<td>Eko Wahyudi</td>";
echo "<td>628121555423</td>";
echo "<td>generasic@gmail.com</td>";
echo "<td>paket_lengkap</td>";
echo "<td>" . $callbackData['order_id'] . "</td>";
echo "<td>" . $callbackData['transaction_id'] . "</td>";
echo "<td>36300</td>";
echo "<td>PENDING</td>";
echo "<td>https://app.sandbox.midtrans.com/snap/v2/vtweb/ea386484-2737-4be0-8f0b-ebc8d8ae6378</td>";
echo "</tr>";

echo "<tr>";
echo "<td colspan='10'><b>Setelah callback, status seharusnya berubah menjadi:</b> " . $paymentStatus . "</td>";
echo "</tr>";

echo "</table>";