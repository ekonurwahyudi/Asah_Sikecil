import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pkg from 'midtrans-client';
const { Snap } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const port = process.env.API_PORT || 3004; // Port berbeda untuk API

// Middleware dasar
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(apiLimiter);

// Konfigurasi Midtrans
let snap = new Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// API status endpoint
app.get('/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    server: 'Asah Sikecil API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Endpoint untuk membuat token transaksi Midtrans
app.post('/create-midtrans-token', async (req, res) => {
  try {
    const { transaction_details, customer_details, item_details, callbacks } = req.body;

    // Tambahkan logging untuk debugging
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Buat transaksi
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
app.post('/midtrans-notification', async (req, res) => {
  // ... kode yang sudah ada ...
});

app.listen(port, () => {
  console.log(`API Server running on port ${port}`);
});