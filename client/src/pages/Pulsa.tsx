import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Smartphone, Search, ArrowLeft, Signal } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface PulsaService {
  brand: string;
  code: string;
  name: string;
  note: string;
  price: {
    basic: number;
    premium: number;
    special: number;
  };
  status: string;
  multi_trx: boolean;
  maintenace: string;
  category: string;
  prepost: string;
  type: string;
  sellingPrice?: number;
  originalPrice?: number;
  isPromo?: boolean;
  promoLabel?: string;
  sortOrder?: number;
}

interface PulsaResponse {
  result: boolean;
  data: PulsaService[];
  message: string;
}

const CARRIER_PREFIXES: Record<string, { prefixes: string[]; brand: string; displayName: string }> = {
  "TELKOMSEL": { 
    prefixes: ["0811", "0812", "0813", "0821", "0822", "0823", "0852", "0853"],
    brand: "TELKOMSEL",
    displayName: "Telkomsel"
  },
  "BY.U": { 
    prefixes: ["0851"],
    brand: "BY.U",
    displayName: "By.U"
  },
  "INDOSAT": { 
    prefixes: ["0814", "0815", "0816", "0855", "0856", "0857", "0858"],
    brand: "INDOSAT",
    displayName: "Indosat"
  },
  "XL": { 
    prefixes: ["0817", "0818", "0819", "0859", "0877", "0878"],
    brand: "XL",
    displayName: "XL"
  },
  "AXIS": { 
    prefixes: ["0831", "0832", "0833", "0838"],
    brand: "AXIS",
    displayName: "Axis"
  },
  "TRI": { 
    prefixes: ["0895", "0896", "0897", "0898", "0899"],
    brand: "TRI",
    displayName: "Tri"
  },
  "SMARTFREN": { 
    prefixes: ["0881", "0882", "0883", "0884", "0885", "0886", "0887", "0888", "0889"],
    brand: "SMARTFREN",
    displayName: "Smartfren"
  },
};

interface CarrierInfo {
  brand: string;
  displayName: string;
}

function detectCarrier(phoneNumber: string): CarrierInfo | null {
  const cleaned = phoneNumber.replace(/\D/g, "");
  
  if (cleaned.length < 4) return null;
  
  const prefix4 = cleaned.substring(0, 4);
  
  for (const [, carrier] of Object.entries(CARRIER_PREFIXES)) {
    if (carrier.prefixes.includes(prefix4)) {
      return { brand: carrier.brand, displayName: carrier.displayName };
    }
  }
  
  return null;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

function getCarrierColor(brand: string | null): string {
  switch (brand) {
    case "TELKOMSEL":
      return "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400";
    case "INDOSAT":
      return "bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400";
    case "XL":
      return "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400";
    case "AXIS":
      return "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400";
    case "TRI":
      return "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400";
    case "SMARTFREN":
      return "bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400";
    case "BY.U":
      return "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}


export default function Pulsa() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const detectedCarrier = useMemo(() => detectCarrier(phoneNumber), [phoneNumber]);

  const { data: pulsaData, isLoading, error } = useQuery<PulsaResponse>({
    queryKey: ["/api/pulsa/services", "pulsa-reguler", detectedCarrier?.brand],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/pulsa/services", {
        filter_type: "type",
        filter_value: "pulsa-reguler",
        brand_filter: detectedCarrier?.brand,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || "Failed to fetch services");
      }
      return response.json();
    },
    enabled: !!detectedCarrier,
  });

  const categories = useMemo(() => {
    if (!pulsaData?.data) return [];
    const cats = new Set(pulsaData.data.map((s) => s.category));
    return Array.from(cats).filter(Boolean).sort();
  }, [pulsaData]);

  const filteredServices = useMemo(() => {
    if (!pulsaData?.data) return [];
    
    return pulsaData.data.filter((service) => {
      if (service.status !== "available") return false;
      
      if (selectedCategory && service.category !== selectedCategory) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          service.name.toLowerCase().includes(query) ||
          service.category.toLowerCase().includes(query) ||
          service.code.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [pulsaData, selectedCategory, searchQuery]);

  // Sort by custom order first, then by price (cheapest first)
  const sortedServices = filteredServices.sort((a, b) => {
    const orderA = a.sortOrder || 0;
    const orderB = b.sortOrder || 0;
    if (orderA !== orderB) return orderA - orderB;
    const priceA = a.sellingPrice || a.price.basic;
    const priceB = b.sellingPrice || b.price.basic;
    return priceA - priceB;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/beranda">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Pulsa & Paket Data</h1>
            <p className="text-muted-foreground text-sm">Isi pulsa dan paket data dengan mudah</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5" />
              Masukkan Nomor HP
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type="tel"
                placeholder="Contoh: 081234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="text-lg pr-24"
                data-testid="input-phone-number"
              />
              {detectedCarrier && (
                <Badge 
                  className={`absolute right-2 top-1/2 -translate-y-1/2 ${getCarrierColor(detectedCarrier.brand)}`}
                  data-testid="badge-carrier"
                >
                  {detectedCarrier.displayName}
                </Badge>
              )}
            </div>
            
            {phoneNumber.length > 0 && phoneNumber.length < 10 && (
              <p className="text-sm text-muted-foreground">
                Masukkan minimal 10 digit nomor HP
              </p>
            )}
            
            {phoneNumber.length >= 4 && !detectedCarrier && (
              <p className="text-sm text-destructive">
                Operator tidak terdeteksi. Pastikan nomor HP valid.
              </p>
            )}
          </CardContent>
        </Card>

        {detectedCarrier && (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  data-testid="button-category-all"
                >
                  Semua
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    data-testid={`button-category-${cat}`}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-10 w-24" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {error && (
              <Card className="border-destructive">
                <CardContent className="p-6 text-center">
                  <p className="text-destructive">Gagal memuat produk. Silakan coba lagi.</p>
                </CardContent>
              </Card>
            )}

            {!isLoading && !error && pulsaData && (
              <div className="space-y-6">
                {sortedServices.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Signal className="h-5 w-5" />
                      Pulsa {detectedCarrier?.displayName}
                    </h2>
                    <div className="grid gap-3">
                      {sortedServices.map((service) => {
                        const displayPrice = service.sellingPrice || service.price.basic;
                        return (
                          <Card 
                            key={service.code} 
                            className="hover-elevate cursor-pointer"
                            data-testid={`card-service-${service.code}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <Signal className="h-4 w-4 shrink-0" />
                                    <h3 className="font-medium truncate">{service.name}</h3>
                                    {service.isPromo && (
                                      <Badge className="shrink-0" data-testid={`badge-promo-${service.code}`}>
                                        {service.promoLabel || "Promo"}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    {service.note && service.note !== "-" && (
                                      <span className="truncate">{service.note}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-bold text-lg text-primary">
                                    {formatPrice(displayPrice)}
                                  </p>
                                  <Button size="sm" className="mt-1" data-testid={`button-buy-${service.code}`}>
                                    Beli
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {sortedServices.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchQuery || selectedCategory
                          ? "Tidak ada produk yang sesuai dengan filter"
                          : `Tidak ada pulsa tersedia untuk ${detectedCarrier?.displayName || "operator ini"}`}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}

        {!detectedCarrier && phoneNumber.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Masukkan nomor HP untuk melihat produk yang tersedia
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
