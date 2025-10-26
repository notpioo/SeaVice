import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Zap, Shield, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Landing() {
  const { user } = useAuth();

  const features = [
    {
      icon: Zap,
      title: "Cepat & Efisien",
      description: "Layanan dikerjakan dengan cepat tanpa mengorbankan kualitas",
    },
    {
      icon: Shield,
      title: "Terpercaya",
      description: "Dikerjakan oleh profesional berpengalaman dan terpercaya",
    },
    {
      icon: Clock,
      title: "Tepat Waktu",
      description: "Garansi pengerjaan sesuai deadline yang telah ditentukan",
    },
  ];

  const stats = [
    { value: "10,000+", label: "Layanan Terselesaikan" },
    { value: "5,000+", label: "Pelanggan Puas" },
    { value: "98%", label: "Tingkat Kepuasan" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Zap className="h-4 w-4" />
                <span>Platform Layanan Digital Terpercaya</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                Solusi Digital
                <span className="block bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent mt-2">
                  Untuk Kebutuhan Anda
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                SeaVice menyediakan berbagai layanan digital profesional untuk membantu pekerjaan, tugas, dan proyek Anda dengan kualitas terbaik.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
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
              
              <div className="flex items-center gap-6 justify-center lg:justify-start text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Gratis Registrasi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-orange-600/20 rounded-3xl blur-3xl"></div>
                <Card className="relative p-8 backdrop-blur-sm bg-card/80">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 hover-elevate transition-all">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Zap className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Pengerjaan Tugas</h3>
                        <p className="text-sm text-muted-foreground">Profesional & Berkualitas</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 hover-elevate transition-all">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Produk Digital</h3>
                        <p className="text-sm text-muted-foreground">Template & Desain Premium</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 hover-elevate transition-all">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Jasa Digital Lainnya</h3>
                        <p className="text-sm text-muted-foreground">Konsultasi & Support</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-8 hover-elevate transition-all">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary/10 via-transparent to-orange-600/10">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Siap Untuk Memulai?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan pengguna yang telah mempercayai SeaVice untuk kebutuhan digital mereka
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user && (
              <>
                <Link href="/register">
                  <Button size="lg" className="text-base px-8 rounded-full" data-testid="button-cta-register">
                    Daftar Gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/layanan">
                  <Button size="lg" variant="outline" className="text-base px-8 rounded-full" data-testid="button-cta-services">
                    Jelajahi Layanan
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
