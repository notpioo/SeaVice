
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Wallet, 
  Briefcase, 
  Bell,
  Megaphone,
  Tag,
  ArrowRight,
  Smartphone
} from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useEffect, useState } from "react";
import { subscribeToAnnouncements } from "@/lib/announcements";
import type { Announcement } from "@shared/schema";

export default function Home() {
  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToAnnouncements(
      (data) => {
        setAnnouncements(data);
      },
      (error) => {
        console.error("Error fetching announcements:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const banners = [
    {
      id: 1,
      title: "Selamat Datang di SeaVice",
      description: "Platform terpercaya untuk berbagai layanan digital profesional",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=400&fit=crop",
      color: "from-orange-500 to-orange-600"
    },
    {
      id: 2,
      title: "Layanan Terbaik untuk Anda",
      description: "Dapatkan berbagai jasa digital berkualitas tinggi",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=400&fit=crop",
      color: "from-blue-500 to-blue-600"
    },
    {
      id: 3,
      title: "Promo Spesial Bulan Ini",
      description: "Nikmati diskon hingga 30% untuk layanan pilihan",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop",
      color: "from-purple-500 to-purple-600"
    }
  ];

  const quickButtons = [
    {
      icon: Smartphone,
      label: "Pulsa",
      href: "/pulsa",
      color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
    },
    {
      icon: Wallet,
      label: "Sealdo",
      href: "/profile",
      color: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
    },
    {
      icon: Tag,
      label: "Voucher",
      href: "/profile",
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
    },
    {
      icon: Megaphone,
      label: "Promo",
      href: "/layanan",
      color: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
    },
    {
      icon: Briefcase,
      label: "Layanan",
      href: "/layanan",
      color: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Banner Carousel */}
        <section className="mb-8 md:mb-12">
          <Carousel
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
          >
            <CarouselContent>
              {banners.map((banner) => (
                <CarouselItem key={banner.id}>
                  <div className="relative overflow-hidden rounded-2xl">
                    <div className="absolute inset-0">
                      <img 
                        src={banner.image} 
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-r ${banner.color} opacity-80`}></div>
                    </div>
                    <div className="relative z-10 px-6 md:px-12 py-12 md:py-20 text-white">
                      <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
                        {banner.title}
                      </h2>
                      <p className="text-sm md:text-lg lg:text-xl mb-6 md:mb-8 max-w-2xl opacity-95">
                        {banner.description}
                      </p>
                      <Link href="/layanan">
                        <Button size="lg" variant="secondary" className="font-semibold">
                          Lihat Layanan
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </section>

        {/* Quick Buttons */}
        <section className="mb-8 md:mb-12">
          <div className="grid grid-cols-5 gap-2 md:gap-3">
            {quickButtons.map((button, index) => {
              const Icon = button.icon;
              return (
                <Link key={index} href={button.href}>
                  <div className="flex flex-col items-center text-center cursor-pointer group">
                    <div className={`h-12 w-12 md:h-14 md:w-14 rounded-xl ${button.color} flex items-center justify-center mb-2 transition-all group-hover:scale-105`}>
                      <Icon className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <span className="text-xs md:text-sm font-medium text-foreground">{button.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Announcements */}
        {announcements.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <Megaphone className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                Pengumuman
              </h3>
            </div>
            <div className="space-y-3 md:space-y-4">
              {announcements.map((announcement) => (
              <Card key={announcement.id} className="hover-elevate transition-all">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {announcement.type === "promo" && (
                            <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center">
                              <span className="text-lg">🎉</span>
                            </div>
                          )}
                          {announcement.type === "new" && (
                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                              <span className="text-lg">✨</span>
                            </div>
                          )}
                          {announcement.type === "info" && (
                            <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
                              <span className="text-lg">ℹ️</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base md:text-lg mb-1 md:mb-2">
                            {announcement.title}
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {announcement.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-xs md:text-sm text-muted-foreground">
                        {announcement.date}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
