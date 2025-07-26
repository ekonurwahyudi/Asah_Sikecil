# Perbaikan Callback Midtrans untuk Asah Sikecil

## Masalah yang Ditemukan

Setelah melakukan analisis terhadap kode dan log, saya menemukan beberapa masalah potensial yang menyebabkan status pembayaran tidak diperbarui di Google Sheet setelah pembayaran berhasil di Midtrans:

1. **Kurangnya Log Debugging**: Callback dari Midtrans tidak memiliki log yang cukup untuk mendiagnosis masalah.
2. **Penanganan Format Data**: Mungkin ada perbedaan format data antara yang dikirim oleh Midtrans dan yang diharapkan oleh Google Script.
3. **Pencarian Baris di Google Sheet**: Google Script mencari baris berdasarkan `order_id` di kolom 6, tetapi mungkin ada ketidakcocokan format atau nilai.
4. **Koneksi ke Google Script**: Mungkin ada masalah dengan koneksi atau respons dari Google Script.

## Solusi yang Diimplementasikan

Saya telah membuat file `callback_fix.php` dengan perbaikan berikut:

1. **Log Lebih Detail**: Menambahkan log untuk setiap tahap pemrosesan callback:
   - Log input mentah (`callback_raw.txt`)
   - Log hasil parsing JSON/query string (`callback_parsed.txt`)
   - Log data yang dikirim ke Google Sheets (`callback_sheets_data.txt`)
   - Log hasil cURL request ke Google Script (`callback_curl.txt`)
   - Log error jika terjadi (`callback_error.txt`)

2. **Debugging cURL**: Menambahkan opsi verbose untuk cURL untuk melihat detail komunikasi dengan Google Script.

## Cara Menggunakan Perbaikan

1. **Backup File Asli**: Buat backup file `callback.php` yang asli:
   ```
   copy d:\Asah_Sikecil\api\payment\callback.php d:\Asah_Sikecil\api\payment\callback.php.bak
   ```

2. **Ganti dengan File Perbaikan**: Salin file perbaikan ke file asli:
   ```
   copy d:\Asah_Sikecil\api\payment\callback_fix.php d:\Asah_Sikecil\api\payment\callback.php
   ```

3. **Uji Callback**: Lakukan pembayaran di Midtrans dan periksa file log yang dihasilkan di folder `api/payment/`:
   - `callback_raw.txt`
   - `callback_parsed.txt`
   - `callback_sheets_data.txt`
   - `callback_curl.txt`
   - `callback_error.txt`

4. **Analisis Log**: Periksa log untuk menemukan masalah spesifik yang terjadi.

## Kemungkinan Masalah dan Solusi

1. **Format Data Tidak Sesuai**:
   - Periksa `callback_parsed.txt` untuk melihat format data yang diterima dari Midtrans.
   - Bandingkan dengan format yang diharapkan oleh Google Script.
   - Sesuaikan format data jika perlu.

2. **Pencarian Baris di Google Sheet**:
   - Pastikan `order_id` yang dikirim oleh Midtrans sama persis dengan yang ada di Google Sheet.
   - Periksa apakah ada perbedaan format (misalnya, huruf besar/kecil, spasi, dll.).

3. **Koneksi ke Google Script**:
   - Periksa `callback_curl.txt` untuk melihat respons dari Google Script.
   - Pastikan URL Google Script benar dan dapat diakses.
   - Periksa apakah ada batasan CORS atau keamanan lainnya.

4. **Struktur Kolom di Google Sheet**:
   - Pastikan struktur kolom di Google Sheet sesuai dengan yang diharapkan oleh Google Script.
   - Kolom 6 (F) harus berisi `order_id` dari Midtrans.
   - Kolom 9 (I) adalah tempat status pembayaran diperbarui.

## Catatan Penting

- File log yang dihasilkan dapat menjadi besar seiring waktu. Pastikan untuk membersihkannya secara berkala.
- Jika masalah masih berlanjut, periksa juga konfigurasi callback di dashboard Midtrans untuk memastikan URL callback sudah benar.
- Pastikan server dapat diakses dari internet agar Midtrans dapat mengirim callback.