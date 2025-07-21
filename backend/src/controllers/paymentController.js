const duitkuService = require('../services/duitkuService');
const sheetController = require('./sheetController');

exports.processPayment = async (req, res) => {
  try {
    const paymentData = req.body;
    
    // Proses pembayaran dengan Duitku
    const duitkuResponse = await duitkuService.createPayment(paymentData);
    
    // Simpan data ke Google Sheets
    await sheetController.saveData({
      body: {
        name: paymentData.name,
        phone: paymentData.phone,
        email: paymentData.email,
        package: paymentData.package,
        idinvoice: duitkuResponse.reference,
        invoice: duitkuResponse.merchantOrderId,
        harga: paymentData.amount,
        status: "PENDING",
        invoice_url: duitkuResponse.paymentUrl
      }
    }, { status: () => ({ json: () => ({}) }) });
    
    res.status(200).json(duitkuResponse);
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ 
      error: 'Payment processing failed', 
      message: error.message 
    });
  }
};

exports.handleCallback = async (req, res) => {
  try {
    const callbackData = req.body;
    
    // Validasi callback dari Duitku
    const isValid = duitkuService.validateCallback(callbackData);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid callback data' });
    }
    
    // Update status di Google Sheets
    const updateResult = await sheetController.updatePaymentStatus(callbackData);
    
    res.status(200).json({ status: 'success', message: 'Callback processed' });
  } catch (error) {
    console.error('Error handling callback:', error);
    res.status(500).json({ 
      error: 'Callback processing failed', 
      message: error.message 
    });
  }
};