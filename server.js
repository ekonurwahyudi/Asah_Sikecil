import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
// Ubah impor midtrans-client
import pkg from 'midtrans-client';
const { Snap } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

dotenv.config();

const app = express();
const port = process.env.PORT || 3003;

// Untuk akses __dirname dalam modul ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware dasar
// Middleware dasar
app.use(cors({
  origin: '*', // Izinkan semua origin untuk debugging
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(express.static('dist'));

// Tambahkan rate limiter di sini, sebelum endpoint API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Batas 100 request per IP dalam 15 menit
  standardHeaders: true,
  legacyHeaders: false,
});

// Terapkan ke semua endpoint API
app.use('/api/', apiLimiter);

// Konfigurasi CSP yang tepat untuk Midtrans Snap - PINDAHKAN KE SINI
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'",
        "*.midtrans.com",
        "*.veritrans.co.id",
        "*.mixpanel.com",
        "*.google-analytics.com",
        "*.cloudfront.net"
      ],
      connectSrc: [
        "'self'", 
        "'unsafe-eval'",
        "*.midtrans.com",
        "*.veritrans.co.id",
        "*.mixpanel.com",
        "*.google-analytics.com",
        "*.cloudfront.net"
      ],
      imgSrc: ["'self'", "data:", "blob:", "*.midtrans.com", "*.veritrans.co.id", "*.cloudfront.net"],
      frameSrc: ["*.midtrans.com", "*.veritrans.co.id"],
      styleSrc: ["'self'", "'unsafe-inline'", "*.midtrans.com", "*.veritrans.co.id"],
      fontSrc: ["'self'", "data:", "*.midtrans.com", "*.veritrans.co.id"],
    },
  })
);

// Konfigurasi Midtrans
let snap = new Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Endpoint untuk membuat token transaksi Midtrans
app.post('/api/create-midtrans-token', async (req, res) => {
  try {
    const { transaction_details, customer_details, item_details, callbacks } = req.body;

    // Tambahkan logging untuk debugging
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Buat transaksi
    // Di endpoint create-midtrans-token
    const transaction = await snap.createTransaction({
      transaction_details,
      customer_details,
      item_details,
      callbacks: {
        finish: 'https://asahsikecil.com?status=success',
        error: 'https://asahsikecil.com?status=error',
        pending: 'https://asahsikecil.com?status=pending'
      }
    });

    // Tambahkan logging untuk debugging
    console.log('Midtrans response:', JSON.stringify(transaction, null, 2));

    // Pastikan respons valid sebelum mengirim
    if (!transaction || (!transaction.token && !transaction.redirect_url)) {
      throw new Error('Invalid response from Midtrans');
    }

    // Kembalikan token ke frontend
    return res.status(200).json({
      token: transaction.token || null,
      redirect_url: transaction.redirect_url || null
    });
  } catch (error) {
    console.error('Error creating Midtrans token:', error);
    return res.status(500).json({ message: 'Error creating payment token', error: error.message });
  }
});

// Endpoint untuk menerima notifikasi dari Midtrans
app.post('/api/midtrans-notification', async (req, res) => {
  try {
    const notification = req.body;
    
    // Tambahkan logging untuk debugging
    console.log('Notification body:', JSON.stringify(notification, null, 2));
    
    // Verifikasi notifikasi dari Midtrans
    const statusResponse = await snap.transaction.notification(notification);
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}`);

    // Proses status transaksi
    let status = "PENDING";
    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        status = "CHALLENGE";
      } else if (fraudStatus === 'accept') {
        status = "SUKSES";
      }
    } else if (transactionStatus === 'settlement') {
      status = "SUKSES";
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      status = "GAGAL";
    } else if (transactionStatus === 'pending') {
      status = "PENDING";
    }

    // Di sini Anda bisa menambahkan kode untuk memperbarui status di Google Sheets
    // Misalnya dengan membuat fungsi untuk memanggil Google Sheets API

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error processing notification:', error);
    return res.status(500).json({ message: 'Error processing notification', error: error.message });
  }
});

// Tambahkan di bagian bawah server.js, sebelum app.listen

// Rute fallback untuk SPA
app.get('*', (req, res) => {
  // Jangan tangani permintaan API
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // Kirim file index.html untuk rute frontend
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});