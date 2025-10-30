import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Clock, CheckCircle2 } from "lucide-react";
import type { Service } from "@shared/schema";
import { getAllServices } from "@/lib/services";

export default function Services() {
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: getAllServices,
  });

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Layanan Kami
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Jelajahi berbagai layanan digital profesional yang kami tawarkan untuk membantu kebutuhan Anda
          </p>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/5] md:aspect-square w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-9 w-full mt-3" />
                </div>
              </Card>
            ))}
          </div>
        ) : services && services.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {services.map((service) => (
              <Link key={service.id} href={`/layanan/${service.id}`}>
                <Card className="group flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer" data-testid={`card-service-${service.id}`}>
                  {/* Image with Category Badge Overlay */}
                  <div className="relative">
                    {service.imageUrl ? (
                      <div className="aspect-square overflow-hidden bg-muted">
                        <img
                          src={service.imageUrl}
                          alt={service.title}
                          className="w-full h-full object-contain"
                          data-testid={`img-service-${service.id}`}
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-gradient-to-br from-primary/20 via-orange-600/20 to-primary/10 flex items-center justify-center">
                        <Package className="h-12 w-12 md:h-16 md:w-16 text-primary/30" />
                      </div>
                    )}
                    
                    {/* Category Badge Overlay */}
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs md:text-sm px-2 py-1 shadow-md">
                        {service.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-2.5 md:p-4 flex flex-col flex-1">
                    {/* Title */}
                    <h3 className="font-bold text-xs md:text-base mb-1.5 line-clamp-2 group-hover:text-primary transition-colors leading-tight" data-testid={`text-title-${service.id}`}>
                      {service.title}
                    </h3>

                    {/* Features - Show only 1 on mobile, 2 on desktop */}
                    <div className="space-y-0.5 mb-2 flex-1">
                      {service.features.slice(0, 1).map((feature, idx) => (
                        <div key={idx} className="md:hidden flex items-start gap-1" data-testid={`text-feature-${service.id}-${idx}`}>
                          <CheckCircle2 className="h-2.5 w-2.5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-[9px] text-muted-foreground line-clamp-1">
                            {feature}
                          </span>
                        </div>
                      ))}
                      {service.features.slice(0, 2).map((feature, idx) => (
                        <div key={idx} className="hidden md:flex items-start gap-1.5" data-testid={`text-feature-${service.id}-${idx}`}>
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {feature}
                          </span>
                        </div>
                      ))}
                      <p className="text-[9px] md:text-xs text-muted-foreground ml-3.5 md:ml-5">
                        +{service.features.length - 1} lainnya
                      </p>
                    </div>

                    {/* Delivery Time */}
                    <div className="flex items-center gap-1 text-muted-foreground mb-2">
                      <Clock className="h-2.5 w-2.5 md:h-3.5 md:w-3.5" />
                      <span className="text-[9px] md:text-xs" data-testid={`text-delivery-${service.id}`}>
                        {service.deliveryTime}
                      </span>
                    </div>

                    {/* Price Only */}
                    <div className="mt-auto">
                      <p className="text-sm md:text-lg font-bold text-primary" data-testid={`text-price-${service.id}`}>
                        Rp {service.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-muted mb-6">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Belum Ada Layanan</h3>
            <p className="text-muted-foreground">
              Layanan akan segera ditambahkan. Silakan kembali lagi nanti.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}