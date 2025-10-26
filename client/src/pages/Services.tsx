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
    <div className="min-h-screen py-16 md:py-24">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-48 w-full rounded-lg" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="flex flex-col hover-elevate transition-all" data-testid={`card-service-${service.id}`}>
                <CardHeader className="space-y-0 pb-4">
                  {service.imageUrl ? (
                    <div className="aspect-video rounded-lg overflow-hidden mb-4 bg-muted">
                      <img
                        src={service.imageUrl}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/10 to-orange-600/10 flex items-center justify-center mb-4">
                      <Package className="h-16 w-16 text-primary/40" />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg leading-tight" data-testid={`text-title-${service.id}`}>
                      {service.title}
                    </h3>
                    <Badge variant="secondary" className="flex-shrink-0">
                      {service.category}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-description-${service.id}`}>
                    {service.description}
                  </p>
                  
                  <div className="space-y-2">
                    {service.features.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                    <Clock className="h-4 w-4" />
                    <span>{service.deliveryTime}</span>
                  </div>
                </CardContent>
                
                <CardFooter className="flex items-center justify-between gap-4 pt-4 border-t">
                  <div>
                    <p className="text-2xl font-bold text-primary" data-testid={`text-price-${service.id}`}>
                      Rp {service.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <Link href={`/layanan/${service.id}`}>
                    <Button size="sm" data-testid={`button-order-${service.id}`}>
                      Lihat Detail
                    </Button>
                  </Link>
                </CardFooter>
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
