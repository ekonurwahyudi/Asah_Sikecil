import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Input } from '@/components/ui/input.jsx'
import { X, Copy, Upload, ArrowLeft, Download } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog.jsx'

function FreeOfferPage() {
  const navigate = useNavigate();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [formStep, setFormStep] = useState(1); // 1: upload gambar, 2: input data
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Tambahkan state untuk loading
  const [userFormData, setUserFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: ""
  });

  // Tambahkan useEffect untuk scroll ke atas saat komponen dimuat
  // Di dalam useEffect
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Preload gambar sukses
    const img = new Image();
    img.src = '/payment_success.png';
    img.src = '/banner_calista.png';
  }, []);

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // Mengambil file yang dipilih (maksimal 3)
      const newFiles = Array.from(e.target.files).slice(0, 3);
      
      // Menghitung berapa banyak slot yang tersisa
      const remainingSlots = 3 - uploadedImages.length;
      
      // Jika slot yang tersisa cukup untuk semua file baru
      if (remainingSlots >= newFiles.length) {
        setUploadedImages([...uploadedImages, ...newFiles]);
      } 
      // Jika slot yang tersisa tidak cukup, ambil sebanyak yang bisa ditampung
      else if (remainingSlots > 0) {
        const filesToAdd = newFiles.slice(0, remainingSlots);
        setUploadedImages([...uploadedImages, ...filesToAdd]);
        alert(`Hanya ${remainingSlots} gambar yang ditambahkan. Maksimal 3 gambar yang dapat diupload.`);
      } 
      // Jika tidak ada slot tersisa
      else {
        alert("Maksimal 3 gambar yang dapat diupload. Hapus salah satu gambar terlebih dahulu.");
      }
    }
    e.target.value = null; // Reset input file
  };

  const handleRemoveImage = (index) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
  };

  const handleCopyCaption = () => {
    const caption = "💡 *Calista AI – #1 Asisten Psikologi & Perkembangan Anak!* \n\n💬 Punya pertanyaan soal tumbuh kembang anak? Sekarang kamu bisa konsultasi *GRATIS* kapan saja lewat Calista AI – asisten pintar berbasis AI khusus untuk bantu kamu memahami kebutuhan psikologis anak. \n\n✅ Jawaban cepat & personal \n✅ Tersedia 24 jam \n✅ Chat via WhatsApp \n\n🎉 Dapatkan juga Worksheet Pintar untuk Anak Cerdas – Untuk melatih kemampuan membaca, menulis, dan berhitung anak di rumah. \n\n📍 Kunjungi sekarang: www.asahsikecil.com \n📢 Kuota terbatas, jangan sampai kelewatan!";
    navigator.clipboard.writeText(caption);
    alert("Caption berhasil disalin!");
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true); // Set loading menjadi true saat proses dimulai
      
      // URL Google Apps Script
      const scriptURL = 'https://script.google.com/macros/s/AKfycbxO_CJpOa4mHka40Dn4XZmUZYrJ8YbXSTnZpcvQ65uuEo4Si0f6lSmQlfViuov6QAzMgg/exec';
      
      // Format nomor telepon
      let formattedPhone = userFormData.phone;
      
      // Jika nomor dimulai dengan '08', ubah menjadi '628'
      if (formattedPhone.startsWith('08')) {
        formattedPhone = '62' + formattedPhone.substring(1);
      }
      // Jika nomor dimulai dengan '8', tambahkan '62' di depan
      else if (formattedPhone.startsWith('8')) {
        formattedPhone = '62' + formattedPhone;
      }
      // Jika nomor dimulai dengan '+62', hapus '+'
      else if (formattedPhone.startsWith('+62')) {
        formattedPhone = formattedPhone.substring(1);
      }
      // Jika nomor dimulai dengan '62', tidak perlu diubah
      
      // Menggunakan FormData alih-alih JSON
      const formData = new FormData();
      formData.append('name', userFormData.name);
      formData.append('phone', formattedPhone); // Gunakan nomor yang sudah diformat
      formData.append('email', userFormData.email);
      formData.append('city', userFormData.city);
      
      // Mengirim data ke Google Sheets
      const params = new URLSearchParams();
      params.append('name', userFormData.name);
      params.append('phone', formattedPhone);
      params.append('email', userFormData.email);
      params.append('city', userFormData.city);
      
      const response = await fetch(scriptURL, {
        method: 'POST',
        body: params.toString(), // Mengubah params menjadi string URL-encoded
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded', // Gunakan content type ini
        }
      });
      
      // Catatan: dengan mode 'no-cors', kita tidak bisa memeriksa response.ok
      // karena respons akan selalu opaque (tidak dapat diakses)
      console.log('Permintaan berhasil dikirim');
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
    } finally {
      setIsLoading(false); // Set loading menjadi false setelah proses selesai
    }
  };

  return (
    
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header dengan tombol kembali */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 flex items-center">
          <button 
            onClick={() => navigate('/')} 
            className="text-white hover:bg-white/20 p-2 rounded-full mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-white">Dapatkan Calista AI Secara Gratis!</h1>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-700 mb-2">Ikuti langkah-langkah berikut:</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Follow akun instagram kami ya 👉 <a href="https://www.instagram.com/asahsikecil"><b className='text-pink-500'>@asahsikecil</b></a> 😊</li>
              <li>Selanjutnya jangan lupa share Calista AI ke 3 grup WhatsApp kamu</li>
              <li>Screenshot dan upload bukti share untuk dapatkan Calista AI</li>
              <li>Berikut gambar dan caption untuk kamu share ke grup WhatsApp:</li>
            </ol>
          </div>
          
          {/* Banner dan caption untuk dibagikan */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-md font-semibold mb-2">Gambar:</h3>
            <img 
              src="/banner_calista.png" 
              alt="Calista AI Banner" 
              className="w-full h-auto max-h-[400px] object-contain mb-4"
            />
            
            <h3 className="text-md font-semibold mb-2">Caption:</h3>
            <div className="bg-gray-100 p-3 rounded-md text-sm">
              <p>💡 <b>Calista AI – #1 Asisten Psikologi & Perkembangan Anak!</b></p> <br/>
              <p>💬 Punya pertanyaan soal tumbuh kembang anak? Sekarang kamu bisa konsultasi GRATIS kapan saja lewat Calista AI – asisten pintar berbasis AI khusus untuk bantu kamu memahami kebutuhan psikologis anak.</p><br/>
              <p>✅ Jawaban cepat & personal</p>
              <p>✅ Tersedia 24 Jam</p>
              <p>✅ Chat via WhatsApp</p><br/>
              <p>🎉 Dapatkan juga Worksheet Pintar untuk Anak Cerdas – Untuk melatih kemampuan membaca, menulis, dan berhitung anak di rumah.</p><br/>
              <p>📍 Kunjungi sekarang: www.asahsikecil.com</p>
              <p>📢 Kuota terbatas, jangan sampai kelewatan!</p>
            </div>
            
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button 
                className="bg-green-500 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center gap-2"
                onClick={handleCopyCaption}
              >
                <Copy className="h-4 w-4" /> Salin Caption
              </button>
              
              <a 
                href="/banner_calista.png" 
                download="calista_ai_banner.png"
                className="bg-blue-500 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" /> Download Gambar
              </a>
            </div>
          </div>
          
          {/* Form upload gambar */}
          {formStep === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Upload Bukti Screenshot (min. 3 gambar):</h3>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                {/* Preview gambar yang diupload */}
                {[0, 1, 2].map((index) => (
                  <div 
                    key={index} 
                    className={`aspect-square border-2 ${uploadedImages[index] ? 'border-green-500' : 'border-dashed border-gray-300'} rounded-lg flex items-center justify-center relative overflow-hidden`}
                  >
                    {uploadedImages[index] ? (
                      <>
                        <img 
                          src={URL.createObjectURL(uploadedImages[index])} 
                          alt={`Upload ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                        <button 
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-2">
                        <Upload className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Gambar {index + 1}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Input file untuk upload gambar */}
              <div className="mb-4">
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                  multiple // Tambahkan atribut multiple
                />
              </div>
              
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                disabled={uploadedImages.length < 3}
                onClick={() => setFormStep(2)}
              >
                Lanjutkan
                {uploadedImages.length < 3 && ` (Upload ${3 - uploadedImages.length} gambar lagi)`}
              </Button>
            </div>
          )}
          
          {/* Form input data pengguna */}
          {formStep === 2 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Lengkapi Data Diri:</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input 
                    id="name" 
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                    placeholder="Masukkan nama lengkap"
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Nomor HP</Label>
                  <Input 
                    id="phone" 
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({...userFormData, phone: e.target.value})}
                    placeholder="Contoh: 08123456789"
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                    placeholder="Contoh: nama@email.com"
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="city">Kota Saat Ini</Label>
                  <Input 
                    id="city" 
                    value={userFormData.city}
                    onChange={(e) => setUserFormData({...userFormData, city: e.target.value})}
                    placeholder="Masukkan kota tempat tinggal"
                    className="mt-1"
                    required
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => setFormStep(1)}
                  >
                    <ArrowLeft className="h-4 w-4" /> Kembali
                  </Button>
                  
                  <Button 
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2"
                    disabled={!userFormData.name || !userFormData.phone || !userFormData.email || !userFormData.city || isLoading}
                    onClick={handleSubmit}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sedang Diproses...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" /> Submit
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
        </div>

        {/* Dialog Sukses */}
    <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-lg p-6">
        <div className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" onClick={() => setShowSuccessModal(false)} />
          <span className="sr-only">Close</span>
        </div>
        
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="relative w-50 h-50">
            <img 
              src="/payment_success.png" 
              alt="Success" 
              className="w-full h-full object-contain"
            />
          </div>
          
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            Terima kasih {userFormData.name}!
          </h1>
          
          <p className="text-sm text-gray-500">
            Data Anda telah kami terima. Kami akan menghubungi Anda melalui WhatsApp untuk memberikan akses ke Calista AI.
          </p>
          
          <button
            onClick={() => {
              setShowSuccessModal(false);
              navigate('/');
            }}
            className="mt-4 bg-[#00D154] text-white py-3 px-9 rounded-md text-sm font-medium hover:bg-[#00B848] transition-colors focus:outline-none focus:ring-2 focus:ring-[#00D154] focus:ring-offset-2"
          >
            OK
          </button>
        </div>
      </DialogContent>
    </Dialog>
      </div>
    </div>
  )
}

export default FreeOfferPage