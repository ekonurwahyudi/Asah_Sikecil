const express = require('express');
const sheetController = require('../controllers/sheetController');

const router = express.Router();

// Route untuk menyimpan data ke Google Sheets
router.post('/save', sheetController.saveData);

module.exports = router;