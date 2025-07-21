const { GoogleSpreadsheet } = require('google-spreadsheet');

// ID dari Google Spreadsheet
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// Kredensial service account (simpan dalam .env atau file terpisah)
const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)
  : require('../../service-account.json');

// Inisialisasi dokumen
let doc;
let sheet;

const initSheet = async () => {
  if (!doc) {
    doc = new GoogleSpreadsheet(SHEET_ID);
    
    // Autentikasi dengan service account
    await doc.useServiceAccountAuth(GOOGLE_SERVICE_ACCOUNT);
    
    // Load info dokumen
    await doc.loadInfo();
    
    // Gunakan sheet pertama
    sheet = doc.sheetsByIndex[0];
  }
  
  return sheet;
};

exports.appendRow = async (rowData) => {
  try {
    const sheet = await initSheet();
    await sheet.addRow(rowData);
    return true;
  } catch (error) {
    console.error('Error appending row to Google Sheet:', error);
    throw error;
  }
};

exports.updatePaymentStatus = async (invoiceNumber, status, reference) => {
  try {
    const sheet = await initSheet();
    
    // Load semua rows
    const rows = await sheet.getRows();
    
    // Cari row dengan invoice number yang sesuai
    for (const row of rows) {
      // Kolom 6 adalah invoice (merchantOrderId dari Duitku)
      if (row._rawData[5] === invoiceNumber) {
        // Update status di kolom 9 (kolom I)
        row._rawData[8] = status;
        
        // Update reference di kolom 7 (kolom G) jika ada
        if (reference) {
          row._rawData[6] = reference;
        }
        
        await row.save();
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error updating payment status in Google Sheet:', error);
    throw error;
  }
};