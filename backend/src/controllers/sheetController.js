const googleSheetService = require('../services/googleSheetService');

exports.saveData = async (req, res) => {
  try {
    const formData = req.body;
    
    // Simpan data ke Google Sheets
    await googleSheetService.appendRow([
      new Date(), // Timestamp
      formData.name,
      formData.phone,
      formData.email,
      formData.package,
      formData.invoice,    // Invoice number (merchantOrderId untuk Duitku)
      formData.idinvoice,  // reference untuk Duitku
      formData.harga,
      formData.status,
      formData.invoice_url
    ]);
    
    // Jika dipanggil langsung sebagai API endpoint
    if (res.status) {
      res.status(200).json({ 
        status: 'success', 
        message: 'Data saved successfully' 
      });
    }
    
    return { status: 'success' };
  } catch (error) {
    console.error('Error saving data:', error);
    
    // Jika dipanggil langsung sebagai API endpoint
    if (res.status) {
      res.status(500).json({ 
        error: 'Failed to save data', 
        message: error.message 
      });
    }
    
    throw error;
  }
};

exports.updatePaymentStatus = async (callbackData) => {
  try {
    // Konversi status code Duitku ke status yang lebih deskriptif
    let paymentStatus = "UNKNOWN";
    if (callbackData.resultCode === "00") {
      paymentStatus = "SUCCESS";
    } else if (callbackData.resultCode === "01") {
      paymentStatus = "FAILED";
    } else if (callbackData.resultCode === "02") {
      paymentStatus = "PENDING";
    }
    
    // Cari dan update status di Google Sheets
    const updated = await googleSheetService.updatePaymentStatus(
      callbackData.merchantOrderId,
      paymentStatus,
      callbackData.reference
    );
    
    return { success: updated };
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};