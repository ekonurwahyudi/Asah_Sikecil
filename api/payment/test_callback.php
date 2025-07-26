<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Midtrans Callback</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        h1 {
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input[type="text"], select, textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background-color: #45a049;
        }
        .response {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f8f8;
            border-left: 4px solid #4CAF50;
        }
        .error {
            border-left: 4px solid #f44336;
        }
        .info-box {
            background-color: #e7f3fe;
            border-left: 6px solid #2196F3;
            padding: 10px;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <h1>Test Midtrans Callback</h1>
    
    <div class="info-box">
        <p><strong>Penting:</strong> Alat ini digunakan untuk menguji callback Midtrans ke Google Sheets. Pastikan Anda memasukkan Order ID yang sesuai dengan No_Invoice di Google Sheets (kolom F).</p>
    </div>

    <form id="callbackForm">
        <div class="form-group">
            <label for="order_id">Order ID (No_Invoice di kolom F):</label>
            <input type="text" id="order_id" name="order_id" placeholder="Contoh: INV-1753532064" required>
        </div>

        <div class="form-group">
            <label for="transaction_id">Transaction ID (Opsional):</label>
            <input type="text" id="transaction_id" name="transaction_id" placeholder="Contoh: test-transaction-id-1753532">
        </div>

        <div class="form-group">
            <label for="transaction_status">Transaction Status:</label>
            <select id="transaction_status" name="transaction_status" required>
                <option value="settlement">settlement (SUKSES)</option>
                <option value="pending">pending (PENDING)</option>
                <option value="deny">deny (FAILED)</option>
                <option value="cancel">cancel (FAILED)</option>
                <option value="expire">expire (FAILED)</option>
            </select>
        </div>

        <div class="form-group">
            <label for="gross_amount">Gross Amount:</label>
            <input type="text" id="gross_amount" name="gross_amount" value="10000" required>
        </div>

        <div class="form-group">
            <label for="status_code">Status Code:</label>
            <input type="text" id="status_code" name="status_code" value="200" required>
        </div>

        <div class="form-group">
            <label for="payment_type">Payment Type:</label>
            <input type="text" id="payment_type" name="payment_type" value="bank_transfer" required>
        </div>

        <div class="form-group">
            <label for="callback_url">Callback URL:</label>
            <select id="callback_url" name="callback_url" required>
                <option value="callback_fix_updated.php">callback_fix_updated.php (Versi Terbaru)</option>
                <option value="callback_fix.php">callback_fix.php (Versi Lama)</option>
                <option value="callback.php">callback.php (Versi Original)</option>
            </select>
        </div>

        <button type="submit">Send Callback</button>
    </form>

    <div id="response" class="response" style="display: none;"></div>

    <script>
        document.getElementById('callbackForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const jsonData = {};
            
            for (const [key, value] of formData.entries()) {
                jsonData[key] = value;
            }
            
            // Tambahkan signature key jika diperlukan
            const serverKey = 'SB-Mid-server-mavVN5HEMxI5scqfPoL8r0hA';
            const orderId = jsonData.order_id;
            const statusCode = jsonData.status_code;
            const grossAmount = jsonData.gross_amount;
            const signatureInput = orderId + statusCode + grossAmount + serverKey;
            
            // Fungsi untuk menghitung SHA-512 hash
            async function sha512(str) {
                const buffer = new TextEncoder().encode(str);
                const hashBuffer = await crypto.subtle.digest('SHA-512', buffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }
            
            // Hitung signature dan kirim callback
            sha512(signatureInput).then(signature => {
                jsonData.signature_key = signature;
                
                // Tambahkan field lain yang diperlukan
                jsonData.transaction_time = new Date().toISOString();
                jsonData.currency = "IDR";
                
                const callbackUrl = document.getElementById('callback_url').value;
                
                // Kirim callback
                fetch(callbackUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(jsonData)
                })
                .then(response => response.json())
                .then(data => {
                    const responseDiv = document.getElementById('response');
                    responseDiv.innerHTML = '<h3>Response:</h3><pre>' + JSON.stringify(data, null, 2) + '</pre>';
                    responseDiv.style.display = 'block';
                    responseDiv.className = data.status === 'success' ? 'response' : 'response error';
                })
                .catch(error => {
                    const responseDiv = document.getElementById('response');
                    responseDiv.innerHTML = '<h3>Error:</h3><pre>' + error + '</pre>';
                    responseDiv.style.display = 'block';
                    responseDiv.className = 'response error';
                });
            });
        });
    </script>
</body>
</html>