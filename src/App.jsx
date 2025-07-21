import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Check, X, ArrowLeft, ArrowRight } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'  // Add this import
import { CheckCircle, Star, Download, Users, Award, Heart, BookOpen, Palette, Calculator, Puzzle, Scissors, Target, Quote, ShoppingCart, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog.jsx'
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel.jsx'
import ImageZoom from './components/ImageZoom'
import './App.css'

function App() {
  const navigate = useNavigate();
  const [api, setApi] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    package: "free",
    idinvoice: "",
    invoice: "", // Akan diisi dari Duitku
    harga: "",   // Akan diambil dari total harga
    status: "belum bayar" // Status default
  });
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1 * 60 * 60 + 43 * 60); // 2 jam dalam detik
  const [currentBuyer, setCurrentBuyer] = useState(0);
  const [showBuyerPopup, setShowBuyerPopup] = useState(true);
  const [bannerTimeLeft, setBannerTimeLeft] = useState(48 * 60); // 48 menit dalam detik

  // Data pembeli
  const buyers = [
    { name: 'Lilis', phone: '6282361******', package: 'Paket Premium' },
    { name: 'Hidayatshadikin', phone: '6285277******', package: 'Paket Premium' },
    { name: 'Diah', phone: '6281132******', package: 'Paket Premium' },
    { name: 'Annabiya Putri', phone: '6281215******', package: 'Paket Premium' },
    { name: 'Musyidah', phone: '6282389******', package: 'Paket Premium' },
    { name: 'Lisa', phone: '62819389******', package: 'Paket Lengkap' },
    { name: 'Yogi', phone: '6282389******', package: 'Paket Free' },
    { name: 'Junita', phone: '6281369******', package: 'Paket Premium' },
    { name: 'Lisa', phone: '62819389******', package: 'Paket Lengkap' },
    { name: 'Dona', phone: '6281239******', package: 'Paket Free' },
    { name: 'Dara', phone: '6281122******', package: 'Paket Premium' },
  ];

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    
    if (status === 'success') {
      setShowSuccessModal(true);
      // Bersihkan parameter dari URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    // Preload gambar sukses
  const img = new Image();
  img.src = '/payment_success.png';
  }, []);

  // Effect untuk mengatur popup pembeli
  useEffect(() => {
    let timeoutId;
    const showNextBuyer = () => {
      setShowBuyerPopup(true);
      
      // Sembunyikan popup setelah 3 detik
      timeoutId = setTimeout(() => {
        setShowBuyerPopup(false);
        
        // Tunggu 3 detik sebelum menampilkan pembeli berikutnya
        setTimeout(() => {
          setCurrentBuyer((prev) => (prev + 1) % buyers.length);
          showNextBuyer();
        }, 10000);
      }, 5000);
    };

    showNextBuyer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
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

  // Tambahkan useEffect baru untuk countdown banner
  useEffect(() => {
    const bannerTimer = setInterval(() => {
      setBannerTimeLeft(prevTime => {
        if (prevTime <= 0) {
          clearInterval(bannerTimer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  
    return () => clearInterval(bannerTimer);
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
  
  // Scroll ke form dengan offset untuk header
  if (formRef.current) {
    const yOffset = -100; // Sesuaikan nilai ini dengan tinggi header
    const y = formRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({top: y, behavior: 'smooth'});
  }
};
  
  // Fungsi untuk memformat waktu
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fungsi untuk memformat waktu banner
  const formatBannerTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} menit ${secs.toString().padStart(2, '0')} detik`;
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
      if (selectedPackage.price === "0") {
        // Format nomor telepon dengan menambahkan 62
        const formattedPhone = formData.phone.startsWith('0') 
          ? '62' + formData.phone.substring(1) 
          : formData.phone.startsWith('62') 
            ? formData.phone 
            : '62' + formData.phone;

        const sheetsResponse = await fetch('https://script.google.com/macros/s/AKfycbwE0O56cZYRFBORG3MicrexavSwOcBr8yFAFUvuOCcDCnbo-XM0JdNuiGAAXD_k90Uh/exec', {
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
            idinvoice: '',
            invoice: invoiceNumber,
            harga: harga,
            status: "SUKSES"
          })
        });

        // Tambahkan delay untuk memastikan data terkirim
        await new Promise(resolve => setTimeout(resolve, 1000));
        setShowSuccessModal(true); // Tampilkan modal sukses
        return;
      }

      // Untuk paket berbayar, lanjutkan dengan Duitku
      // Persiapkan data untuk Duitku API
      const paymentAmount = parseInt(harga.replace(',', ''));
      const productDetails = `Pembelian ${formData.package}`;
      
      // Format nomor telepon dengan menambahkan 62
      const formattedPhone = formData.phone.startsWith('0') 
        ? '62' + formData.phone.substring(1) 
        : formData.phone.startsWith('62') 
          ? formData.phone 
          : '62' + formData.phone;
      
      // Fungsi untuk generate MD5 hash menggunakan implementasi manual
      function generateMD5(text) {
        // Implementasi MD5 sederhana
        function md5cycle(x, k) {
          let a = x[0], b = x[1], c = x[2], d = x[3];
          
          a += (b & c | ~b & d) + k[0] - 680876936 | 0;
          a  = (a << 7 | a >>> 25) + b | 0;
          d += (a & b | ~a & c) + k[1] - 389564586 | 0;
          d  = (d << 12 | d >>> 20) + a | 0;
          c += (d & a | ~d & b) + k[2] + 606105819 | 0;
          c  = (c << 17 | c >>> 15) + d | 0;
          b += (c & d | ~c & a) + k[3] - 1044525330 | 0;
          b  = (b << 22 | b >>> 10) + c | 0;
          
          a += (b & c | ~b & d) + k[4] - 176418897 | 0;
          a  = (a << 7 | a >>> 25) + b | 0;
          d += (a & b | ~a & c) + k[5] + 1200080426 | 0;
          d  = (d << 12 | d >>> 20) + a | 0;
          c += (d & a | ~d & b) + k[6] - 1473231341 | 0;
          c  = (c << 17 | c >>> 15) + d | 0;
          b += (c & d | ~c & a) + k[7] - 45705983 | 0;
          b  = (b << 22 | b >>> 10) + c | 0;
          
          a += (b & c | ~b & d) + k[8] + 1770035416 | 0;
          a  = (a << 7 | a >>> 25) + b | 0;
          d += (a & b | ~a & c) + k[9] - 1958414417 | 0;
          d  = (d << 12 | d >>> 20) + a | 0;
          c += (d & a | ~d & b) + k[10] - 42063 | 0;
          c  = (c << 17 | c >>> 15) + d | 0;
          b += (c & d | ~c & a) + k[11] - 1990404162 | 0;
          b  = (b << 22 | b >>> 10) + c | 0;
          
          a += (b & c | ~b & d) + k[12] + 1804603682 | 0;
          a  = (a << 7 | a >>> 25) + b | 0;
          d += (a & b | ~a & c) + k[13] - 40341101 | 0;
          d  = (d << 12 | d >>> 20) + a | 0;
          c += (d & a | ~d & b) + k[14] - 1502002290 | 0;
          c  = (c << 17 | c >>> 15) + d | 0;
          b += (c & d | ~c & a) + k[15] + 1236535329 | 0;
          b  = (b << 22 | b >>> 10) + c | 0;
          
          a += (b & d | c & ~d) + k[1] - 165796510 | 0;
          a  = (a << 5 | a >>> 27) + b | 0;
          d += (a & c | b & ~c) + k[6] - 1069501632 | 0;
          d  = (d << 9 | d >>> 23) + a | 0;
          c += (d & b | a & ~b) + k[11] + 643717713 | 0;
          c  = (c << 14 | c >>> 18) + d | 0;
          b += (c & a | d & ~a) + k[0] - 373897302 | 0;
          b  = (b << 20 | b >>> 12) + c | 0;
          
          a += (b & d | c & ~d) + k[5] - 701558691 | 0;
          a  = (a << 5 | a >>> 27) + b | 0;
          d += (a & c | b & ~c) + k[10] + 38016083 | 0;
          d  = (d << 9 | d >>> 23) + a | 0;
          c += (d & b | a & ~b) + k[15] - 660478335 | 0;
          c  = (c << 14 | c >>> 18) + d | 0;
          b += (c & a | d & ~a) + k[4] - 405537848 | 0;
          b  = (b << 20 | b >>> 12) + c | 0;
          
          a += (b & d | c & ~d) + k[9] + 568446438 | 0;
          a  = (a << 5 | a >>> 27) + b | 0;
          d += (a & c | b & ~c) + k[14] - 1019803690 | 0;
          d  = (d << 9 | d >>> 23) + a | 0;
          c += (d & b | a & ~b) + k[3] - 187363961 | 0;
          c  = (c << 14 | c >>> 18) + d | 0;
          b += (c & a | d & ~a) + k[8] + 1163531501 | 0;
          b  = (b << 20 | b >>> 12) + c | 0;
          
          a += (b & d | c & ~d) + k[13] - 1444681467 | 0;
          a  = (a << 5 | a >>> 27) + b | 0;
          d += (a & c | b & ~c) + k[2] - 51403784 | 0;
          d  = (d << 9 | d >>> 23) + a | 0;
          c += (d & b | a & ~b) + k[7] + 1735328473 | 0;
          c  = (c << 14 | c >>> 18) + d | 0;
          b += (c & a | d & ~a) + k[12] - 1926607734 | 0;
          b  = (b << 20 | b >>> 12) + c | 0;
          
          a += (b ^ c ^ d) + k[5] - 378558 | 0;
          a  = (a << 4 | a >>> 28) + b | 0;
          d += (a ^ b ^ c) + k[8] - 2022574463 | 0;
          d  = (d << 11 | d >>> 21) + a | 0;
          c += (d ^ a ^ b) + k[11] + 1839030562 | 0;
          c  = (c << 16 | c >>> 16) + d | 0;
          b += (c ^ d ^ a) + k[14] - 35309556 | 0;
          b  = (b << 23 | b >>> 9) + c | 0;
          
          a += (b ^ c ^ d) + k[1] - 1530992060 | 0;
          a  = (a << 4 | a >>> 28) + b | 0;
          d += (a ^ b ^ c) + k[4] + 1272893353 | 0;
          d  = (d << 11 | d >>> 21) + a | 0;
          c += (d ^ a ^ b) + k[7] - 155497632 | 0;
          c  = (c << 16 | c >>> 16) + d | 0;
          b += (c ^ d ^ a) + k[10] - 1094730640 | 0;
          b  = (b << 23 | b >>> 9) + c | 0;
          
          a += (b ^ c ^ d) + k[13] + 681279174 | 0;
          a  = (a << 4 | a >>> 28) + b | 0;
          d += (a ^ b ^ c) + k[0] - 358537222 | 0;
          d  = (d << 11 | d >>> 21) + a | 0;
          c += (d ^ a ^ b) + k[3] - 722521979 | 0;
          c  = (c << 16 | c >>> 16) + d | 0;
          b += (c ^ d ^ a) + k[6] + 76029189 | 0;
          b  = (b << 23 | b >>> 9) + c | 0;
          
          a += (b ^ c ^ d) + k[9] - 640364487 | 0;
          a  = (a << 4 | a >>> 28) + b | 0;
          d += (a ^ b ^ c) + k[12] - 421815835 | 0;
          d  = (d << 11 | d >>> 21) + a | 0;
          c += (d ^ a ^ b) + k[15] + 530742520 | 0;
          c  = (c << 16 | c >>> 16) + d | 0;
          b += (c ^ d ^ a) + k[2] - 995338651 | 0;
          b  = (b << 23 | b >>> 9) + c | 0;
          
          a += (c ^ (b | ~d)) + k[0] - 198630844 | 0;
          a  = (a << 6 | a >>> 26) + b | 0;
          d += (b ^ (a | ~c)) + k[7] + 1126891415 | 0;
          d  = (d << 10 | d >>> 22) + a | 0;
          c += (a ^ (d | ~b)) + k[14] - 1416354905 | 0;
          c  = (c << 15 | c >>> 17) + d | 0;
          b += (d ^ (c | ~a)) + k[5] - 57434055 | 0;
          b  = (b << 21 | b >>> 11) + c | 0;
          
          a += (c ^ (b | ~d)) + k[12] + 1700485571 | 0;
          a  = (a << 6 | a >>> 26) + b | 0;
          d += (b ^ (a | ~c)) + k[3] - 1894986606 | 0;
          d  = (d << 10 | d >>> 22) + a | 0;
          c += (a ^ (d | ~b)) + k[10] - 1051523 | 0;
          c  = (c << 15 | c >>> 17) + d | 0;
          b += (d ^ (c | ~a)) + k[1] - 2054922799 | 0;
          b  = (b << 21 | b >>> 11) + c | 0;
          
          a += (c ^ (b | ~d)) + k[8] + 1873313359 | 0;
          a  = (a << 6 | a >>> 26) + b | 0;
          d += (b ^ (a | ~c)) + k[15] - 30611744 | 0;
          d  = (d << 10 | d >>> 22) + a | 0;
          c += (a ^ (d | ~b)) + k[6] - 1560198380 | 0;
          c  = (c << 15 | c >>> 17) + d | 0;
          b += (d ^ (c | ~a)) + k[13] + 1309151649 | 0;
          b  = (b << 21 | b >>> 11) + c | 0;
          
          a += (c ^ (b | ~d)) + k[4] - 145523070 | 0;
          a  = (a << 6 | a >>> 26) + b | 0;
          d += (b ^ (a | ~c)) + k[11] - 1120210379 | 0;
          d  = (d << 10 | d >>> 22) + a | 0;
          c += (a ^ (d | ~b)) + k[2] + 718787259 | 0;
          c  = (c << 15 | c >>> 17) + d | 0;
          b += (d ^ (c | ~a)) + k[9] - 343485551 | 0;
          b  = (b << 21 | b >>> 11) + c | 0;
          
          x[0] = a + x[0] | 0;
          x[1] = b + x[1] | 0;
          x[2] = c + x[2] | 0;
          x[3] = d + x[3] | 0;
        }
        
        function md5blk(s) {
          let i, md5blks = [];
          
          for (i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
          }
          return md5blks;
        }
        
        function md5blk_array(a) {
          let i, md5blks = [];
          
          for (i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = a[i] + (a[i + 1] << 8) + (a[i + 2] << 16) + (a[i + 3] << 24);
          }
          return md5blks;
        }
        
        function md51(s) {
          let n = s.length,
          state = [1732584193, -271733879, -1732584194, 271733878],
          i,
          length,
          tail,
          tmp,
          lo,
          hi;
          
          for (i = 64; i <= n; i += 64) {
            md5cycle(state, md5blk(s.substring(i - 64, i)));
          }
          s = s.substring(i - 64);
          length = s.length;
          tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
          }
          tail[i >> 2] |= 0x80 << ((i % 4) << 3);
          if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i += 1) {
              tail[i] = 0;
            }
          }
          
          tmp = n * 8;
          tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
          lo = parseInt(tmp[2], 16);
          hi = parseInt(tmp[1], 16) || 0;
          
          tail[14] = lo;
          tail[15] = hi;
          
          md5cycle(state, tail);
          return state;
        }
        
        function md51_array(a) {
          let n = a.length,
          state = [1732584193, -271733879, -1732584194, 271733878],
          i,
          length,
          tail,
          tmp,
          lo,
          hi;
          
          for (i = 64; i <= n; i += 64) {
            md5cycle(state, md5blk_array(a.subarray(i - 64, i)));
          }
          
          a = (i - 64) < n ? a.subarray(i - 64) : new Uint8Array(0);
          length = a.length;
          tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= a[i] << ((i % 4) << 3);
          }
          tail[i >> 2] |= 0x80 << ((i % 4) << 3);
          if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i += 1) {
              tail[i] = 0;
            }
          }
          
          tmp = n * 8;
          tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
          lo = parseInt(tmp[2], 16);
          hi = parseInt(tmp[1], 16) || 0;
          
          tail[14] = lo;
          tail[15] = hi;
          
          md5cycle(state, tail);
          
          return state;
        }
        
        function rhex(n) {
          let s = '', j;
          for (j = 0; j < 4; j += 1) {
            s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
          }
          return s;
        }
        
        function hex(x) {
          let i;
          for (i = 0; i < x.length; i += 1) {
            x[i] = rhex(x[i]);
          }
          return x.join('');
        }
        
        const hex_chr = '0123456789abcdef'.split('');
        
        // Konversi string ke UTF-8 array
        function str2rstr_utf8(input) {
          let output = '';
          let i = -1;
          let x, y;
          
          while (++i < input.length) {
            x = input.charCodeAt(i);
            y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
            if (0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF) {
              x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
              i++;
            }
            if (x <= 0x7F) {
              output += String.fromCharCode(x);
            } else if (x <= 0x7FF) {
              output += String.fromCharCode(0xC0 | ((x >>> 6) & 0x1F), 0x80 | (x & 0x3F));
            } else if (x <= 0xFFFF) {
              output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F), 0x80 | ((x >>> 6) & 0x3F), 0x80 | (x & 0x3F));
            } else if (x <= 0x1FFFFF) {
              output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07), 0x80 | ((x >>> 12) & 0x3F), 0x80 | ((x >>> 6) & 0x3F), 0x80 | (x & 0x3F));
            }
          }
          return output;
        }
        
        // Implementasi utama MD5
        function md5(s) {
          return hex(md51(str2rstr_utf8(s)));
        }
        
        return md5(text);
      }
      
      // Buat signature untuk Duitku (MD5 hash dari merchantCode + merchantOrderId + paymentAmount + apiKey)
      const merchantCode = 'DS24031'; // Ganti dengan merchant code Duitku Anda
      const apiKey = '55b6a2c950325e2e2d181f2b9b2204aa'; // Ganti dengan API key Duitku Anda
      const signature = await generateMD5(`${merchantCode}${invoiceNumber}${paymentAmount}${apiKey}`);
      
      // Data untuk dikirim ke Duitku API
      const duitkuRequestData = {
        merchantCode: merchantCode,
        paymentAmount: paymentAmount,
        paymentMethod: 'VC', // Metode pembayaran default (Virtual Account)
        merchantOrderId: invoiceNumber,
        productDetails: productDetails,
        customerVaName: formData.name,
        email: formData.email,
        phoneNumber: formattedPhone,
        callbackUrl: 'https://asahsikecil.com/callback', // URL Google Sheets untuk callback
        returnUrl: `${window.location.origin}?status=success`,
        signature: signature,
        expiryPeriod: 1440 // 24 jam dalam menit
      };
      
      // Kirim request ke Duitku API - Coba beberapa metode untuk mengatasi CORS
      let duitkuData;
      try {
        // Metode 1: Coba tanpa mode no-cors (default)
        const duitkuResponse = await fetch('https://sandbox.duitku.com/api/merchant/v2/inquiry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(duitkuRequestData)
        });
        
        if (!duitkuResponse.ok) {
          throw new Error(`HTTP error! status: ${duitkuResponse.status}`);
        }
        
        duitkuData = await duitkuResponse.json();
      } catch (error) {
        console.error('Error pada metode pertama:', error);
        
        try {
          // Metode 2: Gunakan proxy CORS jika tersedia
          const corsProxyUrl = 'https://cors-anywhere.herokuapp.com/';
          console.log('Mencoba dengan CORS proxy...');
          
          const proxyResponse = await fetch(`${corsProxyUrl}https://sandbox.duitku.com/api/merchant/v2/inquiry`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Origin': window.location.origin
            },
            body: JSON.stringify(duitkuRequestData)
          });
          
          if (!proxyResponse.ok) {
            throw new Error(`HTTP error dengan proxy! status: ${proxyResponse.status}`);
          }
          
          duitkuData = await proxyResponse.json();
        } catch (proxyError) {
          console.error('Error pada metode proxy:', proxyError);
          alert('Terjadi kesalahan saat menghubungi server pembayaran. Silakan hubungi admin atau coba lagi nanti.');
          setIsLoading(false);
          return;
        }
      }
      
      // Periksa respons dari Duitku
      console.log('Duitku response data:', duitkuData);
      
      if (!duitkuData) {
        console.error('Tidak ada data respons dari Duitku');
        alert('Terjadi kesalahan saat menghubungi server pembayaran. Silakan coba lagi nanti.');
        setIsLoading(false);
        return;
      }
      
      if (duitkuData.statusCode !== "00") {
        console.error('Duitku error code:', duitkuData.statusCode, 'Message:', duitkuData.statusMessage);
        alert(`Error dari Duitku: ${duitkuData.statusMessage || 'Terjadi kesalahan pada server pembayaran'}`);
        setIsLoading(false);
        return;
      }
      
      if (!duitkuData.paymentUrl) {
        console.error('Tidak ada payment URL dari Duitku');
        alert('Terjadi kesalahan pada server pembayaran. Silakan coba lagi nanti.');
        setIsLoading(false);
        return;
      }
      
      console.log('Duitku payment URL:', duitkuData.paymentUrl);
      console.log('Duitku reference:', duitkuData.reference);
      
      // Kirim data ke Google Sheets dengan invoice number
      // Kirim data ke backend untuk diproses
try {
  console.log('Mengirim data ke backend...');
  const backendResponse = await fetch('http://localhost:3004/api/payment/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: formData.name,
      phone: formattedPhone,
      email: formData.email,
      package: formData.package,
      amount: harga
    })
  });
  
  if (!backendResponse.ok) {
    throw new Error(`HTTP error! status: ${backendResponse.status}`);
  }
  
  const responseData = await backendResponse.json();
  
  // Redirect ke halaman pembayaran Duitku
  console.log('Melakukan redirect ke:', responseData.paymentUrl);
  window.location.href = responseData.paymentUrl;
  
} catch (error) {
  console.error('Error details:', error);
  if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
    alert('Gagal terhubung ke server. Mohon periksa koneksi internet Anda.');
  } else {
    alert('Terjadi kesalahan saat memproses pesanan: ' + error.message);
  }
}
    } finally {
      setIsLoading(false);
    }
  };
  const testimonials = [
    {
      name: 'Ibu Sarah',
      location: 'Jakarta',
      rating: 5,
      text: 'Worksheet-nya sangat membantu anak saya belajar menulis, sekarang dia lebih semangat belajar di rumah!',
      package: 'Paket Lengkap',
      image: '/testi/testi1.jpg'
    },
    {
      name: 'Bunda Rina',
      location: 'Surabaya',
      rating: 5,
      text: 'Kualitas gambarnya bagus banget, anak saya suka sekali dengan aktivitas mewarnainya',
      package: 'Paket Premium',
      image: '/testi/testi2.jpg'
    },
    {
      name: 'Ibu Maya',
      location: 'Bandung',
      rating: 5,
      text: 'Harga terjangkau tapi isinya lengkap. Anak jadi lebih fokus dan tidak main gadget terus',
      package: 'Paket Premium',
      image: '/testi/testi3.jpg'
    },
    {
      name: 'Ibu Rial',
      location: 'Yogyakarta',
      rating: 5,
      text: 'Sangat membantu untuk mengajar anak di rumah. Materinya lengkap dan sesuai dengan kurikulum',
      package: 'Paket Premium',
      image: '/testi/testi4.jpg'
    },
    {
      name: 'Moms Anita',
      location: 'Semarang',
      rating: 5,
      text: 'Anak saya jadi lebih tertarik belajar dengan worksheet yang berwarna-warni. Terima kasih!',
      package: 'Paket Lengkap',
      image: '/testi/testi5.jpg'
    },
    {
      name: 'Ibu Lina',
      location: 'Medan',
      rating: 5,
      text: 'Worksheet ini sangat membantu perkembangan motorik halus anak saya. Sangat direkomendasikan!',
      package: 'Paket Premium',
      image: '/testi/testi6.jpg'
    },
    {
      name: 'Bunda Evi',
      location: 'Makassar',
      rating: 5,
      text: 'Kualitas terbaik dengan harga terjangkau. Anak-anak sangat menyukai aktivitas di dalamnya',
      package: 'Paket Premium',
      image: '/testi/testi7.jpg'
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
      {/* Popup Pembeli */}
      <div className={`fixed bottom-4 left-4 z-50 transition-all duration-500 transform ${showBuyerPopup ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-bold text-gray-900">
                {buyers[currentBuyer].name}
              </p>
              <p className="text-sm text-gray-500">
                {buyers[currentBuyer].phone}
              </p>
              <p className="text-sm text-gray-500">
                Baru saja membeli <b>{buyers[currentBuyer].package}</b>
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-40 h-8"
              />
            </div>
            <div className="flex items-center space-x-8">
              <nav className="hidden md:flex space-x-8">
                <a href="#manfaat" className="text-gray-600 hover:text-pink-600 transition-colors">Manfaat</a>
                <a href="#produk" className="text-gray-600 hover:text-pink-600 transition-colors">Produk</a>
                <a href="#paket" className="text-gray-600 hover:text-pink-600 transition-colors">Paket</a>
                <a href="#testimoni" className="text-gray-600 hover:text-pink-600 transition-colors">Testimoni</a>
              </nav>
              <Button 
                className="bg-pink-500 hover:bg-pink-600 hover:scale-105 transform transition-all duration-200 text-white font-semibold text-lg px-6 py-3"
                onClick={() => {
                  if (formRef.current) {
                    const yOffset = -100; // Sesuaikan nilai ini dengan tinggi header
                    const y = formRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({top: y, behavior: 'smooth'});
                  }
                }}
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
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 ">
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
                  <span>12.000++ Worksheet Siap Pakai</span>
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
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white px-8 py-4 text-lg"
                  onClick={() => {
                    document.getElementById('produk').scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Lihat Koleksi Worksheet
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-pink-300 text-pink-600 hover:bg-pink-50 px-8 py-4 text-lg"
                  onClick={() => {
                    document.getElementById('paket').scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Coba Gratis
                </Button>
              </div>

              <div className="flex items-center space-x-6 pt-4">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {/* Mengganti lingkaran warna dengan foto testimonial */}
                    <img src="/testi/testi1.jpg" alt="Testimonial 1" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                    <img src="/testi/testi2.jpg" alt="Testimonial 2" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                    <img src="/testi/testi3.jpg" alt="Testimonial 3" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
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
                <div className="bg-white rounded-2xl p-4 transform -rotate-6 shadow-lg">
                  <img 
                    src="/keluarga_bahagia.jpg" 
                    alt="Keluarga Bahagia" 
                    className="w-full h-auto rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  />
                </div>
              </div>
              <div className="absolute top-2 -right-1 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold transform rotate-19 animate-bounce flex items-center gap-1"> 
                <Palette className="w-3 h-3" />
                Learn, Fun, Grow! 
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 bg-gradient-to-br from-pink-50 to-blue-50">
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
              <img 
                src="/tesjpg.jpg" 
                alt="Fitur Aplikasi" 
                className="w-full h-auto rounded-2xl" 
              />
            </div>
          </div>
        </div>
      </section>


      {/* Product Overview */}
      <section id="produk" className="py-16 bg-gradient-to-r from-pink-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200 mb-4">
              Koleksi Terlengkap
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              12.000++ Worksheet Edukatif Siap Pakai
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Berbagai kategori worksheet untuk mengembangkan kemampuan anak secara menyeluruh
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Belajar Alfabet & Menulis", icon: BookOpen, color: "from-pink-400 to-pink-500", image: "/alphabet.jpg" },
              { title: "Belajar Berhitung & Matematika", icon: Calculator, color: "from-blue-400 to-blue-500", image: "/berhitung.jpg" },
              { title: "Menghubungkan Kata & Gambar", icon: Puzzle, color: "from-yellow-400 to-yellow-500", image: "/menghubungkan_kata.jpg" },
              { title: "Mencocokkan Gambar & Pola", icon: Target, color: "from-green-400 to-green-500", image: "/mencocokan_gambar.jpg" },
              { title: "Mewarnai & Kreativitas", icon: Palette, color: "from-purple-400 to-purple-500", image: "/Mewarnai_kreativitas.jpg" },
              { title: "Aktivitas Motorik Halus", icon: Scissors, color: "from-indigo-400 to-indigo-500", image: "/Aktivitas_Motorik.jpg" }
            ].map((category, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center`}>
                      <category.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg text-gray-800">{category.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-4">
                    Worksheet berkualitas tinggi untuk mengembangkan kemampuan {category.title.toLowerCase()}
                  </CardDescription>
                  
                  {/* Tambahkan komponen ImageZoom di sini */}
                  {category.image && (
                    <div className="mt-4 rounded-lg overflow-hidden">
                      <ImageZoom 
                        src={category.image} 
                        alt={`Contoh worksheet ${category.title}`} 
                        className="w-full h-auto rounded-lg" 
                        aspectRatio={4/3}
                      />
                      <p className="text-xs text-center text-gray-500 mt-2">Klik untuk memperbesar</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
  
      {/* Konsultasi Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 mb-4">
              Konsultasi Online
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              Konsultasi Pengembangan Anak dengan Calista AI
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Dapatkan saran dan panduan profesional untuk perkembangan optimal anak Anda
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="rounded-full overflow-hidden">
                <img 
                  src="/dokter.png" 
                  alt="Konsultasi dengan Calista AI" 
                  className="w-full max-w-lg mx-auto h-auto" 
                />
              </div>
              <div className="absolute top-10 right-10 bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 px-4 py-1.5 rounded-full text-sm font-bold transform rotate-12 shadow-lg border border-yellow-300 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Powered
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  Calista AI Siap Membantu Pengembangan Anak
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Konsultasikan perkembangan anak Anda dengan Calista AI, asisten virtual yang dirancang khusus untuk memberikan saran dan panduan berdasarkan riset terkini tentang perkembangan anak.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-800">Fitur Konsultasi:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-2 hover:bg-blue-50 rounded-lg transition-all">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">WhatsApp Support</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 hover:bg-purple-50 rounded-lg transition-all">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">Chat Online 24/7</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 hover:bg-green-50 rounded-lg transition-all">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">Konsultasi Fleksibel</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 hover:bg-yellow-50 rounded-lg transition-all">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">Respon Cepat & Personal</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                  <span className="font-semibold">Catatan:</span> Calista AI tersedia untuk pengguna <span className="bg-yellow-400 text-yellow-900 font-semibold text-xs px-2 py-0.5 rounded-full inline-block mb-2 transform -rotate-3 hover:rotate-0 transition-transform duration-300">Paket Premium</span> dengan konsultasi tanpa batas selama 2-3 jam melalui WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Package Options */}
      <section id="paket" className="py-16 bg-gradient-to-br from-pink-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              Pilih Paket yang Sesuai
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Berbagai pilihan paket untuk kebutuhan belajar anak Anda
            </p>
            
            {/* Banner Promosi Calista AI */}
             <div className="mt-8 bg-white rounded-xl shadow-xl overflow-hidden mx-auto border border-blue-100 relative">
              <div className="absolute top-4 right-1 bg-yellow-400 text-yellow-900 font-semibold text-sm px-3 py-1 rounded-full inline-block transform rotate-8 hover:rotate-0 transition-transform duration-300 shadow-sm z-10">
                GRATISS!!
              </div>
              <div className="flex flex-col md:flex-row items-center relative">
                <div className="md:w-2/5  flex justify-center items-center p-2 relative overflow-hidden">
                  <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-100 rounded-full opacity-30"></div>
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-pink-100 rounded-full opacity-30"></div>
                  <img 
                    src="/dokter.png" 
                    alt="Calista AI" 
                    className="w-auto h-auto max-h-[170px] object-contain relative z-10"
                  />
                  <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-2 rounded-lg shadow-md z-10 max-w-[170px] hidden md:block">
                    <div className="text-left text-xs text-gray-800 mb-1">Hai, saya <b>Calista</b> 👋
                      <br/>Siap membantu kamu 😊</div>
                  </div>
                </div>
                <div className="md:w-3/5 p-6 text-left relative">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Mau Tau Psikologi dan Perkembangan Sianak?
                  </h3>
                  <p className="text-gray-600 mb-6 max-w">
                    Yuk konsultasi dengan <i>Calista AI</i>, gratis untuk <b>50 Orang</b> tercepat.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="bg-red-100 text-red-600 font-semibold text-sm px-4 py-1.5 rounded-lg shadow-sm border border-red-200 flex items-center">
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                      Sisa kuota: 7 orang lagi
                    </div>
                      <div className="bg-blue-100 text-blue-600 font-semibold text-sm px-4 py-1.5 rounded-lg shadow-sm border border-blue-200 flex items-center"> 
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span> 
                      Berakhir dalam: {formatBannerTime(bannerTimeLeft)}
                    </div>
                  </div>
                <div className="md:absolute md:bottom-6 md:right-8 relative mt-4 w-full md:w-auto">
                  <Button 
                    className="inline-block bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 w-[160px] text-lg"
                    onClick={() => navigate('/free-offer')}
                  >Saya Mau! <ArrowRight className="h-10 w-10" />
                  </Button>
                </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Paket Starter */}
            <Card className="border-2 border-gray-200 hover:border-pink-300 h-[430px] transition-colors duration-300">
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
                <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white mt-4 py-3" onClick={() => handleChoosePackage("Paket Free")}>
                  Pilih Paket Free
                </Button>
              </CardContent>
            </Card>
            {/* Paket Premium */}
            <Card className="border-2 border-blue-500 hover:border-blue-600 h-[630px] transition-colors duration-300">
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
                    <span className="text-gray-600">Update Gratis 2 Bulan</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Bonus Cerita Anak</span>
                  </div>
                </div>
                 {/* Bonus Image */}
                <div className="my-4">
                  <img 
                    src="/bonus.jpg" 
                    alt="Bonus Content" 
                    className="w-full h-auto duration-300" 
                  />
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
                  <div className="bg-yellow-400 text-yellow-900 font-semibold text-xs px-2 py-0.5 rounded-full inline-block mb-2 transform -rotate-3 hover:rotate-0 transition-transform duration-300 animate-bounce">DISKON 80%</div>
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
                    <span className="text-gray-600">12.000++ Worksheet Lengkap</span>
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
                    <span className="text-gray-600">Update Gratis 6 Bulan</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Bonus Cerita Anak, dan +++</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Lisensi Jual Kembali</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Konsultasi dengan <span className="bg-pink-400 text-pink-900 text-white font-semibold text-xs px-2 py-0.5 rounded-full inline-block mb-2 transform -rotate-3 hover:rotate-0 transition-transform duration-300 animate-bounce">Calista AI</span></span>
                  </div>
                </div>
                
                {/* Bonus Image */}
                <div className="my-4">
                  <img 
                    src="/bonus.jpg" 
                    alt="Bonus Content" 
                    className="w-full h-auto duration-300" 
                  />
                </div>
                
                <Button 
  className="w-full bg-pink-500 hover:bg-pink-600 text-white" 
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
      <section id="testimoni" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 px-4">
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

          <div className="relative px-12">
            <Carousel 
              className="w-full"
              opts={{
                align: "start",
                loop: true,
                dragFree: true
              }}
              setApi={setApi}
            >
              <CarouselContent className="-ml-2 mb-4 md:-ml-3 lg:-ml-4">
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="pl-2 md:pl-3 lg:pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
                      <CardHeader>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 overflow-hidden rounded-full">
                              <img 
                                src={testimonial.image} 
                                alt={testimonial.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-gray-800">{testimonial.name}</CardTitle>
                              <CardDescription className="text-gray-600">{testimonial.location}</CardDescription>
                            </div>
                          </div>
                          <Quote className="w-8 h-8 text-gray-300 ml-auto" />
                        </div>
                        <div className="flex items-center space-x-1 mt-2">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 italic mb-4">"{testimonial.text}"</p>
                        <Badge variant="outline" className="text-xs">
                          {testimonial.package}
                        </Badge>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 rounded-full shadow-lg border-gray-200"
                onClick={() => api?.scrollPrev()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 rounded-full shadow-lg border-gray-200"
                onClick={() => api?.scrollNext()}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Carousel>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-pink-400 to-blue-400">
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
      <ShoppingCart className="mr-2 h-7 w-4" />
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

export default App;



