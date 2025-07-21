const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const paymentRoutes = require('./routes/paymentRoutes');
const sheetRoutes = require('./routes/sheetRoutes');

const app = express();

// Middleware dengan konfigurasi CORS yang lebih spesifik
app.use(cors({
  origin: ['http://localhost:5173', 'https://asahsikecil.com'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/payment', paymentRoutes);
app.use('/api/sheets', sheetRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

module.exports = app;