
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, DollarSign, Clock, RefreshCw, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Landing() {
  const { user } = useAuth();
  const [typedText, setTypedText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const words = [
    "Untuk Kebutuhan Anda",
    "Cepat & Terpercaya",
    "Berkualitas Tinggi",
    "Harga Terjangkau"
  ];
  
  const typingSpeed = 100;
  const deletingSpeed = 50;
  const pauseTime = 2000;

  useEffect(() => {
    const currentWord = words[wordIndex];
    
    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (typedText.length < currentWord.length) {
          setTypedText(currentWord.slice(0, typedText.length + 1));
        } else {
          // Pause before deleting
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      } else {
        // Deleting
        if (typedText.length > 0) {
          setTypedText(currentWord.slice(0, typedText.length - 1));
        } else {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, wordIndex]);

  const features = [
    {
      icon: DollarSign,
      title: "Harga Terjangkau",
      description: "Layanan berkualitas dengan harga yang kompetitif dan transparan",
    },
    {
      icon: Clock,
      title: "Tepat Waktu",
      description: "Garansi pengerjaan sesuai deadline yang telah disepakati",
    },
    {
      icon: RefreshCw,
      title: "Garansi Revisi",
      description: "Revisi gratis hingga hasil sesuai dengan kebutuhan Anda",
    },
    {
      icon: Shield,
      title: "Aman & Terpercaya",
      description: "Transaksi aman dengan sistem pembayaran yang terenkripsi",
    },
  ];

  const faqs = [
    {
      question: "Apa itu SeaVice?",
      answer: "SeaVice adalah platform yang menghubungkan Anda dengan penyedia layanan digital profesional. Kami menyediakan berbagai jasa mulai dari pengerjaan tugas, desain, hingga konsultasi digital.",
    },
    {
      question: "Bagaimana cara memesan layanan?",
      answer: "Cukup daftar akun gratis, pilih layanan yang Anda butuhkan, isi detail pesanan, lakukan pembayaran, dan tim kami akan segera mengerjakan pesanan Anda sesuai deadline yang ditentukan.",
    },
    {
      question: "Apakah ada garansi revisi?",
      answer: "Ya! Semua layanan kami dilengkapi dengan garansi revisi. Jika hasil tidak sesuai dengan brief yang Anda berikan, kami akan melakukan revisi hingga Anda puas dengan hasilnya.",
    },
    {
      question: "Berapa lama waktu pengerjaan?",
      answer: "Waktu pengerjaan bervariasi tergantung jenis layanan dan kompleksitas pesanan. Umumnya berkisar 1-7 hari kerja. Detail waktu pengerjaan tertera di setiap halaman layanan.",
    },
    {
      question: "Metode pembayaran apa saja yang tersedia?",
      answer: "Kami menerima berbagai metode pembayaran termasuk transfer bank, e-wallet, dan QRIS. Semua transaksi dijamin aman dan terenkripsi.",
    },
    {
      question: "Bagaimana jika saya tidak puas dengan hasilnya?",
      answer: "Kepuasan Anda adalah prioritas kami. Jika hasil tidak sesuai harapan, Anda berhak mendapatkan revisi gratis sesuai dengan ketentuan yang berlaku pada masing-masing layanan.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <CheckCircle2 className="h-4 w-4" />
              <span>Platform Layanan Digital Terpercaya</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Solusi Digital
              <span className="block bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent mt-2 min-h-[1.2em]">
                {typedText}
                <span className="animate-pulse">|</span>
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              SeaVice menyediakan berbagai layanan digital profesional untuk membantu pekerjaan, tugas, dan proyek Anda dengan kualitas terbaik.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              {user ? (
                <Link href={user.role === "admin" ? "/admin" : "/layanan"}>
                  <Button size="lg" className="text-base px-8 rounded-full" data-testid="button-get-started">
                    Jelajahi Layanan
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="lg" className="text-base px-8 rounded-full" data-testid="button-get-started">
                      Mulai Sekarang
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/layanan">
                    <Button size="lg" variant="outline" className="text-base px-8 rounded-full" data-testid="button-view-services">
                      Lihat Layanan
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-6 justify-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Gratis Registrasi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Garansi Revisi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Mengapa Memilih SeaVice?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Kami berkomitmen memberikan layanan terbaik dengan standar profesional
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-4 md:p-6 lg:p-8 hover-elevate transition-all">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 md:mb-4">
                    <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">{feature.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-lg text-muted-foreground">
              Temukan jawaban untuk pertanyaan umum tentang SeaVice
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {!user && (
            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">
                Masih punya pertanyaan lain?
              </p>
              <Link href="/register">
                <Button size="lg" className="text-base px-8 rounded-full">
                  Daftar Sekarang
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
