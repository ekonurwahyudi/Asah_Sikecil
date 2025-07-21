const axios = require('axios');
const md5 = require('md5');

const MERCHANT_CODE = process.env.DUITKU_MERCHANT_CODE || 'DS24031';
const API_KEY = process.env.DUITKU_API_KEY || '55b6a2c950325e2e2d181f2b9b2204aa';
const DUITKU_BASE_URL = process.env.DUITKU_BASE_URL || 'https://sandbox.duitku.com/api/merchant/v2';

exports.createPayment = async (paymentData) => {
  try {
    // Format nomor telepon
    const formattedPhone = paymentData.phone.startsWith('0') 
      ? `62${paymentData.phone.substring(1)}` 
      : paymentData.phone;
    
    // Generate invoice number
    const timestamp = new Date().getTime();
    const invoiceNumber = `INV-${timestamp}`;
    
    // Ambil jumlah pembayaran berdasarkan paket
    let paymentAmount = 0;
    let productDetails = '';
    
    switch (paymentData.package) {
      case 'premium':
        paymentAmount = 49000;
        productDetails = 'Paket Premium Asah Sikecil';
        break;
      case 'lengkap':
        paymentAmount = 99000;
        productDetails = 'Paket Lengkap Asah Sikecil';
        break;
      case 'free':
        paymentAmount = 0;
        productDetails = 'Paket Free Asah Sikecil';
        break;
      default:
        paymentAmount = 49000;
        productDetails = 'Paket Default Asah Sikecil';
    }
    
    // Buat signature untuk Duitku
    const signature = md5(`${MERCHANT_CODE}${invoiceNumber}${paymentAmount}${API_KEY}`);
    
    // Data untuk dikirim ke Duitku API
    const duitkuRequestData = {
      merchantCode: MERCHANT_CODE,
      paymentAmount: paymentAmount,
      paymentMethod: 'VC', // Metode pembayaran default (Virtual Account)
      merchantOrderId: invoiceNumber,
      productDetails: productDetails,
      customerVaName: paymentData.name,
      email: paymentData.email,
      phoneNumber: formattedPhone,
      callbackUrl: `${process.env.BACKEND_URL || 'https://asahsikecil.com'}/api/payment/callback`,
      returnUrl: `${process.env.FRONTEND_URL || 'https://asahsikecil.com'}?status=success`,
      signature: signature,
      expiryPeriod: 1440 // 24 jam dalam menit
    };
    
    // Kirim request ke Duitku API
    const response = await axios.post(
      `${DUITKU_BASE_URL}/inquiry`,
      duitkuRequestData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Periksa respons dari Duitku
    if (response.data.statusCode !== "00") {
      throw new Error(`Duitku error: ${response.data.statusMessage}`);
    }
    
    return {
      ...response.data,
      merchantOrderId: invoiceNumber
    };
  } catch (error) {
    console.error('Duitku service error:', error);
    throw error;
  }
};

exports.validateCallback = (callbackData) => {
  try {
    // Validasi signature dari callback
    const apiKey = API_KEY;
    const amount = callbackData.amount;
    const merchantOrderId = callbackData.merchantOrderId;
    const reference = callbackData.reference;
    const resultCode = callbackData.resultCode;
    
    const signature = md5(merchantOrderId + resultCode + reference + amount + apiKey);
    
    return signature === callbackData.signature;
  } catch (error) {
    console.error('Callback validation error:', error);
    return false;
  }
};