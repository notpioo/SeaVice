import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Wifi, 
  Settings, 
  Eye, 
  EyeOff, 
  Loader2, 
  Save,
  Search,
  ArrowLeft,
  Percent,
  DollarSign,
  Tag
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface KuotaService {
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
  category: string;
  type: string;
  customization?: ProductCustomization | null;
}

interface ProductCustomization {
  productCode: string;
  productType: string;
  brand: string;
  isVisible: boolean;
  customPrice?: number;
  markupType: "percentage" | "fixed";
  markupValue: number;
  sortOrder: number;
  customName?: string;
  customNote?: string;
  isPromo: boolean;
  promoLabel?: string;
}

interface GlobalMarkup {
  productType: string;
  markupType: "percentage" | "fixed";
  markupValue: number;
  isActive: boolean;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const BRANDS = [
  { value: "all", label: "Semua Provider" },
  { value: "TELKOMSEL", label: "Telkomsel" },
  { value: "XL", label: "XL" },
  { value: "INDOSAT", label: "Indosat" },
  { value: "TRI", label: "Tri" },
  { value: "SMARTFREN", label: "Smartfren" },
  { value: "AXIS", label: "Axis" },
];

export default function AdminKuotaProducts() {
  const { toast } = useToast();
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<KuotaService | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGlobalDialogOpen, setIsGlobalDialogOpen] = useState(false);

  const { data: kuotaData, isLoading } = useQuery({
    queryKey: ["/api/pulsa/services/raw", "paket-internet", selectedBrand],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/pulsa/services/raw", {
        filter_type: "type",
        filter_value: "paket-internet",
        brand_filter: selectedBrand === "all" ? undefined : selectedBrand,
      });
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      return response.json();
    },
  });

  const { data: globalMarkupData } = useQuery({
    queryKey: ["/api/admin/global-markup"],
    queryFn: async () => {
      const response = await fetch("/api/admin/global-markup");
      return response.json();
    },
  });

  const globalKuotaMarkup = useMemo(() => {
    return globalMarkupData?.data?.find((m: GlobalMarkup) => m.productType === "kuota") || {
      productType: "kuota",
      markupType: "fixed",
      markupValue: 500,
      isActive: true,
    };
  }, [globalMarkupData]);

  const form = useForm<ProductCustomization>({
    defaultValues: {
      isVisible: true,
      markupType: "fixed",
      markupValue: 0,
      sortOrder: 0,
      isPromo: false,
    },
  });

  const globalForm = useForm<GlobalMarkup>({
    defaultValues: {
      productType: "kuota",
      markupType: "fixed",
      markupValue: 500,
      isActive: true,
    },
  });

  useEffect(() => {
    if (globalKuotaMarkup) {
      globalForm.reset(globalKuotaMarkup);
    }
  }, [globalKuotaMarkup, globalForm]);

  const saveMutation = useMutation({
    mutationFn: async (data: ProductCustomization) => {
      const response = await apiRequest("POST", "/api/admin/product-customizations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pulsa/services/raw"] });
      toast({
        title: "Berhasil",
        description: "Pengaturan produk berhasil disimpan",
      });
      setIsDialogOpen(false);
      setEditingProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menyimpan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveGlobalMutation = useMutation({
    mutationFn: async (data: GlobalMarkup) => {
      const response = await apiRequest("POST", "/api/admin/global-markup", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/global-markup"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pulsa/services"] });
      toast({
        title: "Berhasil",
        description: "Markup global berhasil disimpan",
      });
      setIsGlobalDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menyimpan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ product, isVisible }: { product: KuotaService; isVisible: boolean }) => {
      const customization: ProductCustomization = {
        productCode: product.code,
        productType: "kuota",
        brand: product.brand,
        isVisible,
        markupType: product.customization?.markupType || "fixed",
        markupValue: product.customization?.markupValue || 0,
        sortOrder: product.customization?.sortOrder || 0,
        isPromo: product.customization?.isPromo || false,
        customName: product.customization?.customName,
        customNote: product.customization?.customNote,
        customPrice: product.customization?.customPrice,
        promoLabel: product.customization?.promoLabel,
      };
      const response = await apiRequest("POST", "/api/admin/product-customizations", customization);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pulsa/services/raw"] });
      toast({
        title: "Berhasil",
        description: "Visibilitas produk diperbarui",
      });
    },
  });

  const handleEditProduct = (product: KuotaService) => {
    setEditingProduct(product);
    form.reset({
      productCode: product.code,
      productType: "kuota",
      brand: product.brand,
      isVisible: product.customization?.isVisible !== false,
      customPrice: product.customization?.customPrice,
      markupType: product.customization?.markupType || "fixed",
      markupValue: product.customization?.markupValue || 0,
      sortOrder: product.customization?.sortOrder || 0,
      customName: product.customization?.customName || "",
      customNote: product.customization?.customNote || "",
      isPromo: product.customization?.isPromo || false,
      promoLabel: product.customization?.promoLabel || "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenGlobalSettings = () => {
    globalForm.reset(globalKuotaMarkup);
    setIsGlobalDialogOpen(true);
  };

  const onSubmit = (data: ProductCustomization) => {
    if (editingProduct) {
      saveMutation.mutate({
        ...data,
        productCode: editingProduct.code,
        productType: "kuota",
        brand: editingProduct.brand,
      });
    }
  };

  const onGlobalSubmit = (data: GlobalMarkup) => {
    saveGlobalMutation.mutate({
      ...data,
      productType: "kuota",
    });
  };

  const filteredServices = useMemo(() => {
    if (!kuotaData?.data) return [];
    return kuotaData.data.filter((service: KuotaService) => {
      if (service.status !== "available") return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          service.name.toLowerCase().includes(query) ||
          service.code.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [kuotaData, searchQuery]);

  const calculateSellingPrice = (service: KuotaService) => {
    const basePrice = service.price.basic;
    const customization = service.customization;
    
    if (customization?.customPrice) {
      return customization.customPrice;
    }
    
    if (customization?.markupValue) {
      if (customization.markupType === "percentage") {
        return Math.ceil(basePrice * (1 + customization.markupValue / 100));
      }
      return basePrice + customization.markupValue;
    }
    
    if (globalKuotaMarkup?.isActive && globalKuotaMarkup.markupValue > 0) {
      if (globalKuotaMarkup.markupType === "percentage") {
        return Math.ceil(basePrice * (1 + globalKuotaMarkup.markupValue / 100));
      }
      return basePrice + globalKuotaMarkup.markupValue;
    }
    
    return basePrice;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Kelola Paket Kuota</h1>
          <p className="text-muted-foreground">Atur harga, visibilitas, dan markup paket internet</p>
        </div>
        <Button onClick={handleOpenGlobalSettings} data-testid="button-global-settings">
          <Settings className="h-4 w-4 mr-2" />
          Markup Global
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {globalKuotaMarkup.markupType === "percentage" ? (
                  <Percent className="h-5 w-5 text-primary" />
                ) : (
                  <DollarSign className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <p className="font-medium">Markup Global Kuota</p>
                <p className="text-sm text-muted-foreground">
                  {globalKuotaMarkup.isActive ? (
                    globalKuotaMarkup.markupType === "percentage" 
                      ? `+${globalKuotaMarkup.markupValue}% dari harga modal`
                      : `+${formatPrice(globalKuotaMarkup.markupValue)} per produk`
                  ) : (
                    "Tidak aktif"
                  )}
                </p>
              </div>
            </div>
            <Badge variant={globalKuotaMarkup.isActive ? "default" : "secondary"}>
              {globalKuotaMarkup.isActive ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-brand">
                <SelectValue placeholder="Pilih Provider" />
              </SelectTrigger>
              <SelectContent>
                {BRANDS.map((brand) => (
                  <SelectItem key={brand.value} value={brand.value}>
                    {brand.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wifi className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Tidak ada produk ditemukan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredServices.map((service: KuotaService) => {
            const isHidden = service.customization?.isVisible === false;
            const hasCustomization = !!service.customization;
            const sellingPrice = calculateSellingPrice(service);
            const profit = sellingPrice - service.price.basic;

            return (
              <Card 
                key={service.code} 
                className={isHidden ? "opacity-50" : ""}
                data-testid={`card-product-${service.code}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Wifi className="h-4 w-4 shrink-0" />
                        <span className="font-medium truncate">
                          {service.customization?.customName || service.name}
                        </span>
                        <Badge variant="outline" className="shrink-0">{service.code}</Badge>
                        {service.customization?.isPromo && (
                          <Badge className="shrink-0">
                            <Tag className="h-3 w-3 mr-1" />
                            {service.customization.promoLabel || "Promo"}
                          </Badge>
                        )}
                        {hasCustomization && (
                          <Badge variant="secondary" className="shrink-0">Custom</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Modal: {formatPrice(service.price.basic)}</span>
                        <span>Jual: {formatPrice(sellingPrice)}</span>
                        <span className="text-green-600">Profit: {formatPrice(profit)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleVisibilityMutation.mutate({ 
                          product: service, 
                          isVisible: isHidden 
                        })}
                        disabled={toggleVisibilityMutation.isPending}
                        data-testid={`button-toggle-${service.code}`}
                      >
                        {isHidden ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProduct(service)}
                        data-testid={`button-edit-${service.code}`}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Atur
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pengaturan Produk</DialogTitle>
            <DialogDescription>
              {editingProduct?.name} ({editingProduct?.code})
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="isVisible"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Tampilkan Produk</FormLabel>
                      <FormDescription>Produk akan ditampilkan ke customer</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-visibility"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Custom (Opsional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Kosongkan untuk pakai markup"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        data-testid="input-custom-price"
                      />
                    </FormControl>
                    <FormDescription>
                      Jika diisi, akan mengabaikan pengaturan markup
                    </FormDescription>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="markupType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Markup</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-markup-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                          <SelectItem value="percentage">Persentase (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="markupValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nilai Markup</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-markup-value"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="customName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Custom (Opsional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={editingProduct?.name}
                        {...field}
                        data-testid="input-custom-name"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPromo"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Tandai sebagai Promo</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-promo"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("isPromo") && (
                <FormField
                  control={form.control}
                  name="promoLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label Promo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Promo"
                          {...field}
                          data-testid="input-promo-label"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urutan (Sort Order)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-sort-order"
                      />
                    </FormControl>
                    <FormDescription>
                      Angka lebih kecil tampil lebih dulu
                    </FormDescription>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  <Save className="h-4 w-4 mr-2" />
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isGlobalDialogOpen} onOpenChange={setIsGlobalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Markup Global Kuota</DialogTitle>
            <DialogDescription>
              Atur markup default untuk semua paket kuota
            </DialogDescription>
          </DialogHeader>
          <Form {...globalForm}>
            <form onSubmit={globalForm.handleSubmit(onGlobalSubmit)} className="space-y-4">
              <FormField
                control={globalForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Aktifkan Markup Global</FormLabel>
                      <FormDescription>
                        Berlaku untuk produk tanpa custom markup
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-global-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={globalForm.control}
                  name="markupType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Markup</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-global-markup-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                          <SelectItem value="percentage">Persentase (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={globalForm.control}
                  name="markupValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nilai Markup</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-global-markup-value"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsGlobalDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={saveGlobalMutation.isPending}>
                  {saveGlobalMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  <Save className="h-4 w-4 mr-2" />
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
