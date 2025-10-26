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
                <Skeleton className="h-40 w-full" />
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
              <Card key={service.id} className="group flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1" data-testid={`card-service-${service.id}`}>
                {/* Compact Image */}
                <Link href={`/layanan/${service.id}`} className="block">
                  {service.imageUrl ? (
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={service.imageUrl}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-orange-600/10 flex items-center justify-center">
                      <Package className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                </Link>
                
                {/* Compact Content */}
                <div className="flex-1 flex flex-col p-4">
                  {/* Title & Category */}
                  <div className="mb-2">
                    <Badge variant="secondary" className="text-xs mb-2">
                      {service.category}
                    </Badge>
                    <Link href={`/layanan/${service.id}`}>
                      <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors" data-testid={`text-title-${service.id}`}>
                        {service.title}
                      </h3>
                    </Link>
                  </div>
                  
                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3" data-testid={`text-description-${service.id}`}>
                    {service.description}
                  </p>
                  
                  {/* Features - Show only 2 */}
                  <div className="space-y-1.5 mb-3 flex-1">
                    {service.features.slice(0, 2).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-xs line-clamp-1">{feature}</span>
                      </div>
                    ))}
                    {service.features.length > 2 && (
                      <p className="text-xs text-muted-foreground pl-5">
                        +{service.features.length - 2} lainnya
                      </p>
                    )}
                  </div>
                  
                  {/* Delivery Time */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 pb-3 border-b">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{service.deliveryTime}</span>
                  </div>
                  
                  {/* Price & CTA */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-lg font-bold text-primary" data-testid={`text-price-${service.id}`}>
                        Rp {service.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <Link href={`/layanan/${service.id}`}>
                      <Button size="sm" className="h-8 text-xs" data-testid={`button-order-${service.id}`}>
                        Pesan
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
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
