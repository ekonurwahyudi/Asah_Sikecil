const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

// Route untuk memproses pembayaran
router.post('/process', paymentController.processPayment);

// Route untuk callback dari Duitku
router.post('/callback', paymentController.handleCallback);

module.exports = router;