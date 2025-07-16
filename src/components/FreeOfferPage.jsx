import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Input } from '@/components/ui/input.jsx'
import { X, Copy, Upload, ArrowLeft } from 'lucide-react'

function FreeOfferPage() {
  const navigate = useNavigate();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [formStep, setFormStep] = useState(1); // 1: upload gambar, 2: input data
  const [userFormData, setUserFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: ""
  });

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      if (uploadedImages.length < 3) {
        setUploadedImages([...uploadedImages, e.target.files[0]]);
      } else {
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
    const caption = "🤖 CALISTA AI - Asisten Psikologi Anak 🤖\n\nKonsultasi GRATIS dengan AI Psikolog Anak! Tanya apapun tentang perkembangan dan psikologi anak.\n\n✅ Jawaban cepat & akurat\n✅ Berbasis riset terkini\n✅ Tersedia 24/7\n\nKuota terbatas! Cek di: [link website]";
    navigator.clipboard.writeText(caption);
    alert("Caption berhasil disalin!");
  };

  const handleSubmit = () => {
    // Di sini kita akan mengirim data ke Google Sheets
    // Untuk demo, kita hanya menampilkan alert
    alert(`Terima kasih ${userFormData.name}! Data Anda telah kami terima. Kami akan menghubungi Anda melalui WhatsApp untuk memberikan akses ke Calista AI.`);
    
    // Kembali ke halaman utama
    navigate('/');
    
    // Implementasi sebenarnya akan mengirim data ke Google Sheets
    // Contoh pseudocode:
    // sendToGoogleSheets({
    //   name: userFormData.name,
    //   phone: userFormData.phone,
    //   email: userFormData.email,
    //   city: userFormData.city,
    //   uploadTime: new Date().toISOString()
    // });
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
              <li>Kamu harus share Calista AI ke 3 grup WhatsApp kamu</li>
              <li>Screenshot dan upload bukti share untuk dapatkan Calista AI</li>
              <li>Berikut banner dan caption untuk kamu share ke grup WhatsApp:</li>
            </ol>
          </div>
          
          {/* Banner dan caption untuk dibagikan */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-md font-semibold mb-2">Banner:</h3>
            <img 
              src="/dokter.png" 
              alt="Calista AI Banner" 
              className="w-full h-auto max-h-[200px] object-contain mb-4"
            />
            
            <h3 className="text-md font-semibold mb-2">Caption:</h3>
            <div className="bg-gray-100 p-3 rounded-md text-sm">
              <p>🤖 <b>CALISTA AI - Asisten Psikologi Anak</b> 🤖</p>
              <p>Konsultasi GRATIS dengan AI Psikolog Anak! Tanya apapun tentang perkembangan dan psikologi anak.</p>
              <p>✅ Jawaban cepat & akurat</p>
              <p>✅ Berbasis riset terkini</p>
              <p>✅ Tersedia 24/7</p>
              <p>Kuota terbatas! Cek di: [link website]</p>
            </div>
            
            <button 
              className="mt-3 w-full bg-green-500 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center gap-2"
              onClick={handleCopyCaption}
            >
              <Copy className="h-4 w-4" /> Salin Caption
            </button>
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
                    className="flex-1"
                    onClick={() => setFormStep(1)}
                  >
                    Kembali
                  </Button>
                  
                  <Button 
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    disabled={!userFormData.name || !userFormData.phone || !userFormData.email || !userFormData.city}
                    onClick={handleSubmit}
                  >
                    Kirim
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FreeOfferPage