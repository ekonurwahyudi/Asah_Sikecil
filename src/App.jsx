import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Check, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'  // Add this import
import { CheckCircle, Star, Download, Users, Award, Heart, BookOpen, Palette, Calculator, Puzzle, Scissors, Target, Quote,ShoppingCart, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog.jsx'
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'

function App() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    package: "free",
    idinvoice: "",
    invoice: "", // Akan diisi dari Xendit
    harga: "",   // Akan diambil dari total harga
    status: "belum bayar" // Status default
  });
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1 * 60 * 60 + 43 * 60); // 2 jam dalam detik

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    
    if (status === 'success') {
      setShowSuccessModal(true);
      // Bersihkan parameter dari URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  
    return () => clearInterval(timer);
  }, []);
  const formRef = useRef(null);

// Tambahkan fungsi untuk scroll dan memilih paket
const handleChoosePackage = (packageName) => {
  // Konversi nama paket ke id
  let packageId;
  switch(packageName) {
    case "Paket Free":
      packageId = "free";
      break;
    case "Paket Premium":
      packageId = "premium";
      break;
    case "Paket Lengkap":
      packageId = "lengkap";
      break;
    default:
      packageId = "free";
  }
  
  // Set paket yang dipilih
  handleInputChange("package", packageId);
  
  // Scroll ke form
  formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
  
  // Fungsi untuk memformat waktu
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi input
    if (!formData.name || !formData.phone || !formData.email || !formData.package) {
      alert('Mohon lengkapi semua data yang diperlukan');
      return;
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Format email tidak valid');
      return;
    }

    // Validasi nomor telepon (minimal 10 digit)
    if (formData.phone.length < 10) {
      alert('Nomor telepon tidak valid');
      return;
    }

    setIsLoading(true);
    try {
      // Dapatkan harga berdasarkan paket yang dipilih
      const selectedPackage = packages.find(p => p.id === formData.package);
      const harga = selectedPackage ? selectedPackage.price : "0";
      
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;

      // Jika paket free, langsung simpan ke Google Sheets
      if (formData.package === 'free') {
        const sheetsResponse = await fetch('https://script.google.com/macros/s/AKfycbw-9R5o_UhFaiuea4Sv8abRgNgqQOWIFXyyMOQJmHmIyc-WUN79oJ3YdADvaszkNeOd/exec', {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            package: formData.package,
            idinvoice: '',
            invoice: invoiceNumber,
            harga: harga,
            status: "SUKSES"
          })
        });

        // Tambahkan delay untuk memastikan data terkirim
        await new Promise(resolve => setTimeout(resolve, 2000));
        setShowSuccessModal(true); // Tampilkan modal sukses
        return;

        // Tampilkan modal sukses
        setShowSuccessModal(true);
        return;
      }

      // Untuk paket berbayar, lanjutkan dengan Xendit
      const xenditResponse = await fetch('https://api.xendit.co/v2/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa('xnd_development_MpbO8bNvQMywUflJVRZw8KuaG7yqXGFnmvY4g4F6ZQqHeoscILqne9a4kbzuZUa:')
        },
        body: JSON.stringify({
          external_id: invoiceNumber,
          amount: parseInt(harga.replace(',', '')),
          payer_email: formData.email,
          description: `Pembelian ${formData.package}`,
          invoice_duration: 86400,
          customer: {
            given_names: formData.name,
            email: formData.email,
            mobile_number: formData.phone
          },
          customer_notification_preference: {
            invoice_created: ['email'],
            invoice_reminder: ['whatsapp', 'email'], 
            invoice_paid: ['email'],
            invoice_expired: ['whatsapp', 'email']
          },
          success_redirect_url: `${window.location.origin}?status=success`,
          failure_redirect_url: `${window.location.origin}/failed`
        })
      });

      const xenditData = await xenditResponse.json();
      
      if (xenditData.invoice_url) {
        // Format nomor telepon dengan menambahkan 62
        const formattedPhone = formData.phone.startsWith('0') 
          ? '62' + formData.phone.substring(1) 
          : formData.phone.startsWith('62') 
            ? formData.phone 
            : '62' + formData.phone;

        // Kirim data ke Google Sheets dengan invoice number
        const sheetsResponse = await fetch('https://script.google.com/macros/s/AKfycby1eUvCra3NpAIJKc_XT49b_n0SQeK7bq-XoHFMQlmd_qfFy0rosDQ76CBUkwtc8oup/exec', {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: formData.name,
            phone: formattedPhone,
            email: formData.email,
            package: formData.package,
            idinvoice: xenditData.id,
            invoice: invoiceNumber,
            harga: harga,
            status: "PENDING",
            invoice_url: xenditData.invoice_url
          })
        });

        // Tambahkan delay sebelum redirect untuk memastikan data terkirim
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Redirect ke halaman pembayaran Xendit
        window.location.href = xenditData.invoice_url;
      }
    } catch (error) {
      console.error('Error details:', error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        alert('Gagal terhubung ke server. Mohon periksa koneksi internet Anda.');
      } else {
        alert('Terjadi kesalahan saat memproses pesanan: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };
  const testimonials = [
    {
      name: "Ibu Sarah",
      location: "Jakarta",
      rating: 5,
      text: "Worksheet-nya sangat membantu anak saya belajar menulis. Sekarang dia lebih semangat belajar di rumah!",
      package: "Paket Lengkap"
    },
    {
      name: "Ibu Rina",
      location: "Surabaya", 
      rating: 5,
      text: "Kualitas gambarnya bagus banget, anak saya suka sekali dengan aktivitas mewarnainya. Recommended!",
      package: "Paket Premium"
    },
    {
      name: "Ibu Maya",
      location: "Bandung",
      rating: 5,
      text: "Harga terjangkau tapi isinya lengkap. Anak jadi lebih fokus dan tidak main gadget terus.",
      package: "Paket Starter"
    }
  ];
  const packages = [
    {
      id: "free",
      name: "Paket Free",
      price: "0",
      originalPrice: "0"
    },
    {
      id: "lengkap",
      name: "Paket Lengkap",
      price: "36,300",
      originalPrice: "120,000"
    },
    {
      id: "premium",
      name: "Paket Premium",
      price: "47,500",
      originalPrice: "250,000"
    }
  ];

  const features = [
    {
      icon: BookOpen,
      title: "Tracing Letters",
      description: "Menebalkan huruf untuk melatih kemampuan menulis anak",
      color: "from-pink-400 to-pink-500"
    },
    {
      icon: Calculator,
      title: "Number Recognition", 
      description: "Mengenal angka dan belajar berhitung dasar",
      color: "from-blue-400 to-blue-500"
    },
    {
      icon: Puzzle,
      title: "Word Matching",
      description: "Mencocokkan kata dengan gambar untuk vocabulary",
      color: "from-yellow-400 to-yellow-500"
    },
    {
      icon: Target,
      title: "Picture Matching",
      description: "Mencocokkan gambar untuk melatih konsentrasi",
      color: "from-green-400 to-green-500"
    },
    {
      icon: Palette,
      title: "Coloring Activities",
      description: "Aktivitas mewarnai untuk kreativitas anak",
      color: "from-purple-400 to-purple-500"
    },
    {
      icon: Scissors,
      title: "Cut & Paste",
      description: "Aktivitas gunting tempel untuk motorik halus",
      color: "from-indigo-400 to-indigo-500"
    }
  ]

  const benefits = [
    "Mengembangkan kemampuan motorik halus",
    "Meningkatkan konsentrasi dan fokus",
    "Memperkuat kemampuan kognitif",
    "Mempersiapkan anak untuk sekolah",
    "Mengurangi screen time dengan aktivitas positif",
    "Membangun kemandirian belajar"
  ]

  const faqData = [
    {
      question: "Apakah worksheet ini cocok untuk semua usia?",
      answer: "Worksheet kami dirancang khusus untuk anak usia 2-9 tahun dengan tingkat kesulitan yang bervariasi. Setiap worksheet sudah disesuaikan dengan tahap perkembangan anak."
    },
    {
      question: "Bagaimana cara download setelah pembelian?",
      answer: "Setelah pembayaran berhasil, Anda akan langsung mendapat link download melalui WhatsApp atau email. File dapat diunduh dalam format PDF dan PNG."
    },
    {
      question: "Apakah bisa dicetak berulang kali?",
      answer: "Ya, tentu saja! Setelah Anda membeli, file menjadi milik Anda sepenuhnya dan bisa dicetak sebanyak yang dibutuhkan."
    },
    {
      question: "Berapa lama mendapat update gratis?",
      answer: "Tergantung paket yang dipilih. Paket Lengkap mendapat update 6 bulan, Paket Premium mendapat update 1 tahun penuh."
    },
    {
      question: "Apakah ada garansi jika tidak puas?",
      answer: "Ya, kami memberikan garansi uang kembali 100% dalam 7 hari jika Anda tidak puas dengan produk kami."
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">ASK</span>
              </div>
              <span className="text-xl font-bold text-gray-800">Asah Sikecil</span>
            </div>
            <div className="flex items-center space-x-8">
              <nav className="hidden md:flex space-x-8">
                <a href="#produk" className="text-gray-600 hover:text-pink-600 transition-colors text-lg font-medium">Produk</a>
                <a href="#manfaat" className="text-gray-600 hover:text-pink-600 transition-colors">Manfaat</a>
                <a href="#paket" className="text-gray-600 hover:text-pink-600 transition-colors">Paket</a>
                <a href="#testimoni" className="text-gray-600 hover:text-pink-600 transition-colors">Testimoni</a>
              </nav>
              <Button 
                className="bg-pink-500 hover:bg-pink-600 hover:scale-105 transform transition-all duration-200 text-white font-semibold text-lg px-6 py-3"
                onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              ><ShoppingCart className="mr-2 h-4 w-4" />
                Pesan Sekarang
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                  ✨ Worksheet Terlengkap di Indonesia
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-800 leading-tight">
                  Worksheet Pintar untuk 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500"> Anak Cerdas</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Koleksi lengkap worksheet printable berbahasa Indonesia untuk mengembangkan kemampuan menulis, membaca, dan berhitung anak usia 2-9 tahun
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <CheckCircle className="w-6 h-6 text-green-500 animate-bounce" />
                  <span>500+ Worksheet Siap Pakai</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Update Gratis Setiap Bulan</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Kualitas HD Siap Cetak</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white px-8 py-4 text-lg">
                  <Download className="w-5 h-5 mr-2" />
                  Lihat Koleksi Worksheet
                </Button>
                <Button size="lg" variant="outline" className="border-pink-300 text-pink-600 hover:bg-pink-50 px-8 py-4 text-lg">
                  Coba Gratis
                </Button>
              </div>

              <div className="flex items-center space-x-6 pt-4">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-pink-400 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-blue-400 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-yellow-400 rounded-full border-2 border-white"></div>
                  </div>
                  <span className="text-sm text-gray-600">2000+ Orang Tua Puas</span>
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">4.9/5</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-pink-200 to-blue-200 rounded-3xl p-8 transform rotate-3 shadow-xl">
                <div className="bg-white rounded-2xl p-6 transform -rotate-6 shadow-lg">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-16 bg-pink-100 rounded flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-pink-500" />
                      </div>
                      <div className="h-16 bg-blue-100 rounded flex items-center justify-center">
                        <Calculator className="w-8 h-8 text-blue-500" />
                      </div>
                      <div className="h-16 bg-yellow-100 rounded flex items-center justify-center">
                        <Palette className="w-8 h-8 text-yellow-500" />
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold transform rotate-12">
                Worksheet Sample
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              Mengapa Memilih Worksheet Kami?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Dirancang khusus untuk perkembangan optimal anak Indonesia dengan metode pembelajaran yang terbukti efektif
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800">Metode Pembelajaran Efektif</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Belajar sambil bermain dengan aktivitas yang menyenangkan dan sesuai tahap perkembangan anak
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800">Kualitas Premium</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Desain HD berkualitas tinggi, siap cetak di kertas A4, mudah digunakan dan tahan lama
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800">Update Gratis</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Dapatkan worksheet baru setiap bulan tanpa biaya tambahan, koleksi terus bertambah
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Features */}
      <section className="py-20 bg-gradient-to-r from-pink-100 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 mb-4">
              Fitur Unggulan
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              Aktivitas Lengkap untuk Perkembangan Anak
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Setiap worksheet dirancang untuk mengembangkan berbagai aspek kemampuan anak
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-3`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg text-gray-800">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="manfaat" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200 mb-4">
                Manfaat untuk Anak
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-6">
                Perkembangan Optimal dengan Cara yang Menyenangkan
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Worksheet kami dirancang berdasarkan penelitian perkembangan anak untuk memberikan manfaat maksimal
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <div className="w-8 h-8 bg-pink-500 rounded-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <div className="w-8 h-8 bg-blue-500 rounded-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <div className="w-8 h-8 bg-green-500 rounded-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Overview */}
      <section id="produk" className="py-16 bg-gradient-to-br from-pink-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200 mb-4">
              Koleksi Terlengkap
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              500+ Worksheet Edukatif Siap Pakai
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Berbagai kategori worksheet untuk mengembangkan kemampuan anak secara menyeluruh
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Belajar Alfabet & Menulis", count: "150+", color: "from-pink-400 to-pink-500" },
              { title: "Belajar Berhitung & Matematika", count: "120+", color: "from-blue-400 to-blue-500" },
              { title: "Menghubungkan Kata & Gambar", count: "80+", color: "from-yellow-400 to-yellow-500" },
              { title: "Mencocokkan Gambar & Pola", count: "70+", color: "from-green-400 to-green-500" },
              { title: "Mewarnai & Kreativitas", count: "60+", color: "from-purple-400 to-purple-500" },
              { title: "Aktivitas Motorik Halus", count: "50+", color: "from-indigo-400 to-indigo-500" }
            ].map((category, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center mb-3`}>
                    <span className="text-white font-bold text-lg">{category.count}</span>
                  </div>
                  <CardTitle className="text-lg text-gray-800">{category.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    Worksheet berkualitas tinggi untuk mengembangkan kemampuan {category.title.toLowerCase()}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Package Options */}
      <section id="paket" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              Pilih Paket yang Sesuai
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Berbagai pilihan paket untuk kebutuhan belajar anak Anda
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Paket Starter */}
            <Card className="border-2 border-gray-200 hover:border-pink-300 transition-colors duration-300">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gray-800">Paket Free</CardTitle>
                <div className="text-3xl font-bold text-gray-800">
                  Rp 0
                </div>
                <CardDescription className="text-gray-600 mt-2">
                  Cocok untuk memulai
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">100+ Worksheet Dasar</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Alfabet & Angka</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Mewarnai Sederhana</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Format PDF</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Tidak Ada Update</span>
                  </div>
                </div>
                <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white" onClick={() => handleChoosePackage("Paket Free")}>
                  Pilih Paket Free
                </Button>
              </CardContent>
            </Card>
            {/* Paket Premium */}
            <Card className="border-2 border-blue-500 hover:border-blue-600 transition-colors duration-300">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gray-800">Paket Lengkap</CardTitle>
                <div className="text-3xl font-bold text-blue-600">
                <div className="bg-yellow-400 text-yellow-900 font-semibold text-xs px-2 py-0.5 rounded-full inline-block mb-2 transform -rotate-3 hover:rotate-0 transition-transform duration-300">DISKON 60%</div>
                    <strike className="text-gray-500 text-xl">Rp. 120.000</strike> <br />
                    Rp. 36.300
                </div>
                <CardDescription className="text-gray-600 mt-2">
                  Fitur terlengkap
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">2000+ Worksheet Lengkap</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Semua Kategori</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Format PDF</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Update Gratis 6 Bulan</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Bonus Cerita Anak</span>
                  </div>
                </div>
                <Button 
  className="w-full bg-blue-500 hover:bg-blue-600 text-white" 
  onClick={() => handleChoosePackage("Paket Lengkap")} 
> 
  Pilih Paket Lengkap 
</Button> 
              </CardContent>
            </Card>

            {/* Paket Lengkap */}
            <Card className="border-2 border-pink-500 shadow-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-pink-500 text-white px-4 py-1">
                  BEST SELLER
                </Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gray-800">Paket Premium</CardTitle>
                <div className="text-3xl font-bold text-pink-600">
                  <div className="bg-yellow-400 text-yellow-900 font-semibold text-xs px-2 py-0.5 rounded-full inline-block mb-2 transform -rotate-3 hover:rotate-0 transition-transform duration-300">DISKON 80%</div>
                  <strike className="text-gray-500 text-base">Rp. 250.000</strike> <br />
                  Rp. 47.500
                </div>
                <CardDescription className="text-gray-600 mt-2">
                  Paling populer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">12.500+ Worksheet Lengkap</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Semua Kategori</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Format PDF</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Bisa diakses via table tanpa print</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Update Gratis 12 Bulan</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Bonus Cerita Anak, dan +++</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Lisensi Jual Kembali</span>
                  </div>
                </div>
                <Button 
  className="w-full bg-blue-500 hover:bg-blue-600 text-white" 
  onClick={() => handleChoosePackage("Paket Premium")} 
> 
  Pilih Paket Premium 
</Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimoni" className="py-16 bg-gradient-to-br from-pink-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 mb-4">
              Testimoni
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              Dipercaya Ribuan Orang Tua
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Lihat apa kata orang tua yang sudah merasakan manfaat worksheet kami
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-blue-400 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{testimonial.name.charAt(4)}</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-800">{testimonial.name}</CardTitle>
                      <CardDescription className="text-gray-600">{testimonial.location}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <Quote className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-gray-700 italic mb-4">"{testimonial.text}"</p>
                  <Badge variant="outline" className="text-xs">
                    {testimonial.package}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-pink-500 to-blue-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Mulai Perjalanan Belajar Anak Sekarang!
          </h2>
          <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan orang tua yang sudah merasakan manfaatnya
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm max-w-xl mx-auto rounded-2xl p-6 mb-8">
            <div className="text-yellow-300 lg:text-2xl font-bold mb-6">
            🎉 Penawaran Terbatas 🎉
            </div>
            <div className="text-center">
    <div className="flex gap-2 justify-center">
      <div className="bg-white rounded-lg p-3 w-20 flex flex-col items-center">
        <div className="text-pink-600 text-3xl font-bold">{Math.floor(timeLeft / 86400).toString().padStart(2, '0')}</div>
        <div className="text-gray-600 text-xs uppercase">Hari</div>
      </div>
      <div className="bg-white rounded-lg p-3 w-20 flex flex-col items-center">
        <div className="text-pink-600 text-3xl font-bold">{Math.floor((timeLeft % 86400) / 3600).toString().padStart(2, '0')}</div>
        <div className="text-gray-600 text-xs uppercase">Jam</div>
      </div>
      <div className="bg-white rounded-lg p-3 w-20 flex flex-col items-center">
        <div className="text-pink-600 text-3xl font-bold">{Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0')}</div>
        <div className="text-gray-600 text-xs uppercase">Menit</div>
      </div>
      <div className="bg-white rounded-lg p-3 w-20 flex flex-col items-center">
        <div className="text-pink-600 text-3xl font-bold">{(timeLeft % 60).toString().padStart(2, '0')}</div>
        <div className="text-gray-600 text-xs uppercase">detik</div>
      </div>
    </div>
  </div>
          </div>
          

          <div className="flex flex-col sm:flex-row gap-4 justify-center ">
            {/* Tambahkan form sebelum tombol Pesan Sekarang */}
            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xl mx-0 mb-6 bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 ">Form Pemesanan</h3>
              
              <div className="flex flex-col gap-3 text-left">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Masukkan nama Anda"
                  required
                />
              </div>

              <div className="flex flex-col gap-3 text-left">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Masukkan nomor telepon"
                  required
                />
                <p className="text-xs text-red-500 mt-1">*pastikan nomor HP benar untuk menerima link download</p>
              </div>

              <div className="flex flex-col gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Masukkan email Anda"
                  required
                />
              </div>

              <div className="flex flex-col gap-3">
                <Label htmlFor="package">Pilih Paket</Label>
                <Select value={formData.package} onValueChange={(value) => handleInputChange("package", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih paket" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} - {pkg.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-4">Rincian Pesanan:</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>Rp {packages.find(p => p.id === formData.package)?.originalPrice || '0'}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Discount</span>
                    <span className="text-pink-600">- Rp {(parseInt(packages.find(p => p.id === formData.package)?.originalPrice.replace(/\,/g, '')) - parseInt(packages.find(p => p.id === formData.package)?.price.replace(/\,/g, ''))).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>TOTAL</span>
                    <span>Rp {packages.find(p => p.id === formData.package)?.price || '0'}</span>
                  </div>
                </div>
              </div>

              <Button 
  type="submit" 
  className={`w-full ${isLoading ? 'bg-green-500 hover:bg-green-600' : ''}`} 
  disabled={isLoading}
>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Sedang diproses...
    </>
  ) : (
    <>
      <ShoppingCart className="mr-2 h-4 w-4" />
      Pesan Sekarang
    </>
  )}
</Button>
              <div className="mt-2"> 
              <img 
                src="/Payment.png" 
                alt="Metode Pembayaran" 
                className="w-full max-w-md mx-auto"
              />
              <div className="flex items-center justify-center space-x-2 mt-3"> 
              <CheckCircle className="w-5 h-5 text-green-600" /> 
              <span className="text-sm">Garansi uang kembali 100% jika tidak puas</span> 
            </div> 
            <div className="flex items-center justify-center space-x-2"> 
              <CheckCircle className="w-5 h-5 text-green-600" /> 
              <span className="text-sm">Download langsung setelah pembayaran</span> 
            </div>
          </div>
            </form>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-2xl text-gray-700 font-medium">
              Temukan jawaban untuk pertanyaan umum tentang worksheet kami
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqData.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-gray-200 rounded-lg px-6">
                <AccordionTrigger className="text-left text-lg font-semibold text-gray-800 hover:text-pink-600">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      {/* <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">PK</span>
                </div>
                <span className="text-lg font-bold">Asah Sikecil</span>
              </div>
              <p className="text-gray-400">
                Worksheet pintar untuk anak cerdas dan kreatif
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Produk</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Worksheet Alfabet</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Worksheet Matematika</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Aktivitas Kreatif</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Bantuan</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cara Pemesanan</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kontak</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Kontak</h3>
              <ul className="space-y-2 text-gray-400">
                <li>WhatsApp: +62 812-3456-7890</li>
                <li>Email: info@printablekidsword.com</li>
                <li>Instagram: @printablekidsword</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Asah Sikecil. All rights reserved.</p>
          </div>
        </div>
      </footer> */}
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
          alt="Payment Success" 
          className="w-full h-full object-contain"
        />
      </div>
      
      <h1 className="text-xl font-bold text-gray-900 mb-4">
        Payment Success!
      </h1>
      
      <p className="text-sm text-gray-500">
        Silakan cek WhatsApp Anda secara berkala untuk mendapatkan link download.
      </p>
      
      <button
        onClick={() => {
          setShowSuccessModal(false);
          window.location.href = '/';
        }}
        className="mt-4 bg-[#00D154] text-white py-3 px-9 rounded-md text-sm font-medium hover:bg-[#00B848] transition-colors focus:outline-none focus:ring-2 focus:ring-[#00D154] focus:ring-offset-2"
      >
        OK
      </button>
    </div>
  </DialogContent>
</Dialog>
    </div>
  )
}

export default App



