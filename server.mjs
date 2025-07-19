// Ganti ini:
// const express = require('express');
// const cors = require('cors');
// const midtransClient = require('midtrans-client');
// const bodyParser = require('body-parser');

// Menjadi ini:
import express from 'express';
import cors from 'cors';
// Ubah import midtrans-client
import pkg from 'midtrans-client';
const { Snap } = pkg;
import bodyParser from 'body-parser';

import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Konfigurasi Midtrans
let snap = new Snap({
  isProduction: false, // Set true untuk production
  serverKey: 'SB-Mid-server-mavVN5HEMxI5scqfPoL8r0hA',
  clientKey: 'SB-Mid-client-Tg3EWP-wjBlTYscF'
});

// Endpoint untuk membuat transaksi Midtrans
app.post('/create-midtrans-transaction', async (req, res) => {
  try {
    const { order_id, gross_amount, customer_details, item_details } = req.body;
    
    const parameter = {
      transaction_details: {
        order_id: order_id,
        gross_amount: gross_amount
      },
      customer_details: customer_details,
      item_details: item_details,
      credit_card: {
        secure: true
      }
    };

    const transaction = await snap.createTransaction(parameter);
    
    res.status(200).json({
      status: 'success',
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: order_id
    });
  } catch (error) {
    console.error('Error creating Midtrans transaction:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Endpoint untuk menerima notifikasi dari Midtrans
app.post('/midtrans-notification', async (req, res) => {
  try {
    const notification = req.body;
    
    // Verifikasi notifikasi dari Midtrans
    const statusResponse = await snap.transaction.notification(notification);
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}`);

    // Proses status transaksi
    let status = '';
    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        status = 'CHALLENGE';
      } else if (fraudStatus === 'accept') {
        status = 'SUKSES';
      }
    } else if (transactionStatus === 'settlement') {
      status = 'SUKSES';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      status = 'GAGAL';
    } else if (transactionStatus === 'pending') {
      status = 'PENDING';
    }

    // Kirim update status ke Google Sheets
    if (status) {
      try {
        // Kirim data ke Google Sheets untuk update status
        const sheetsResponse = await fetch('https://script.google.com/macros/s/AKfycbwuCVUXswwCxONgmEwJ4gJXZKD86TA8Rwf6PxLcOAt4S9eZjd0MUMfSrbmMmaIQbe2s/exec', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            idinvoice: orderId,
            status: status,
            update_status: true // Flag untuk menandakan ini adalah update status
          })
        });
        
        console.log(`Status untuk order ${orderId} berhasil diupdate ke ${status}`);
      } catch (updateError) {
        console.error('Error saat mengupdate status di Google Sheets:', updateError);
      }
    }
    
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error processing Midtrans notification:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Endpoint untuk mendapatkan status transaksi
app.get('/transaction-status/:order_id', async (req, res) => {
  try {
    const { order_id } = req.params;
    const statusResponse = await snap.transaction.status(order_id);
    
    res.status(200).json({
      status: 'success',
      data: statusResponse
    });
  } catch (error) {
    console.error('Error getting transaction status:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Mulai server
// Tambahkan ini di bagian atas file
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Tambahkan ini sebelum middleware lainnya
// Serve static files dari folder dist
app.use(express.static(path.join(__dirname, 'dist')));

// Tambahkan route untuk menangani semua request yang tidak cocok dengan endpoint API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Ubah konfigurasi port
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});