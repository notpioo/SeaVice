import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { useParams } from "wouter";
import { getAllServices } from "@/lib/services";
import { createOrder } from "@/lib/orders";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Package,
  Star,
  Shield,
  Zap,
  Loader2,
  CheckCircle, // Import CheckCircle for the new layout
} from "lucide-react";
import type { Service } from "@shared/schema";

const orderFormSchema = z.object({
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

export default function ServiceDetail() {
  const [, params] = useRoute("/layanan/:id");
  const [, setLocation] = useLocation();
  const serviceId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: getAllServices,
  });

  const service = services?.find(s => s.id === serviceId);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      notes: "",
    },
  });

  const orderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      setIsOrderDialogOpen(false);
      form.reset();
      setLocation(`/pesanan/${order.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Membuat Pesanan",
        description: error.message || "Terjadi kesalahan saat membuat pesanan",
        variant: "destructive",
      });
    },
  });

  const handleOrderClick = () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login terlebih dahulu untuk memesan layanan",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }
    setIsOrderDialogOpen(true);
  };

  const onSubmit = (data: OrderFormData) => {
    if (!user || !service) return;

    orderMutation.mutate({
      userId: user.id,
      serviceId: service.id,
      serviceName: service.title,
      servicePrice: service.price,
      status: "pending",
      notes: data.notes,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <Skeleton className="h-10 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96 w-full rounded-lg" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-60 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-80 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen py-16 md:py-24 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-muted mb-6">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Layanan Tidak Ditemukan</h2>
          <Link href="/layanan">
            <Button data-testid="button-back-to-services">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Layanan
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8">
      {/* Back Button - tight to navbar */}
      <div className="bg-background border-b md:border-none sticky md:relative top-16 md:top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Link href="/layanan">
            <Button variant="ghost" className="my-2 md:my-6 -ml-3 hover-elevate active-elevate-2" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto md:px-8">
        {/* Mobile Layout - Shopee Style */}
        <div className="md:hidden">
          {/* Image Section - Full Width */}
          {service.imageUrl ? (
            <div className="relative aspect-video bg-muted border-b">
              <img
                src={service.imageUrl}
                alt={service.title}
                className="w-full h-full object-cover"
                data-testid="img-service"
              />
            </div>
          ) : (
            <div className="relative aspect-video bg-muted border-b">
              <Package className="absolute inset-0 m-auto h-32 w-32 text-muted-foreground/20" />
            </div>
          )}

          {/* Title and Price - Sticky Card */}
          <div className="bg-background px-4 py-4 space-y-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary" data-testid="text-price">
                  Rp {service.price.toLocaleString('id-ID')}
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  Harga sudah termasuk revisi
                </p>
              </div>
              <h1 className="text-xl font-bold" data-testid="text-title">
                {service.title}
              </h1>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  <span className="ml-1 font-medium">5.0</span>
                </div>
                <span>•</span>
                <span>100+ Pesanan</span>
              </div>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="mx-4 mb-4">
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium">Waktu Pengerjaan: {service.deliveryTime}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <Card className="mx-4 mb-4">
            <CardHeader>
              <h2 className="text-base font-semibold">Deskripsi Layanan</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-description">
                {service.description}
              </p>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="mx-4 mb-4">
            <CardHeader>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Yang Anda Dapatkan
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {service.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3" data-testid={`text-feature-${idx}`}>
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Guarantee */}
          {service.guarantee && (
            <div className="mx-4 mb-4">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-xs font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  Garansi kepuasan 100%
                </p>
              </div>
            </div>
          )}

          {/* Fixed Bottom Button - Mobile */}
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg z-20">
            <Button
              size="lg"
              className="w-full text-base h-12"
              onClick={handleOrderClick}
              data-testid="button-order-now"
            >
              Pesan Sekarang
            </Button>
          </div>
        </div>

        {/* Desktop Layout - Original Grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 px-4 md:px-0">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            {service.imageUrl ? (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={service.imageUrl}
                  alt={service.title}
                  className="w-full h-full object-cover"
                  data-testid="img-service"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/10 to-orange-600/10 flex items-center justify-center">
                <Package className="h-24 w-24 text-primary/40" />
              </div>
            )}

            {/* Title & Category */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-title">
                  {service.title}
                </h1>
                <Badge variant="secondary" className="flex-shrink-0">
                  {service.category}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="ml-1 font-medium">5.0</span>
                </div>
                <span>•</span>
                <span>100+ Pesanan</span>
              </div>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Deskripsi Layanan</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-description">
                  {service.description}
                </p>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Yang Anda Dapatkan</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3" data-testid={`text-feature-${idx}`}>
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Why Choose Us */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Mengapa Memilih Kami?</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Pengerjaan Cepat</h3>
                      <p className="text-sm text-muted-foreground">
                        Kami memastikan layanan diselesaikan tepat waktu sesuai deadline yang dijanjikan.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Kualitas Terjamin</h3>
                      <p className="text-sm text-muted-foreground">
                        Hasil kerja profesional dengan quality control ketat untuk kepuasan Anda.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Revisi Gratis</h3>
                      <p className="text-sm text-muted-foreground">
                        Kami berikan revisi tanpa biaya tambahan hingga Anda puas dengan hasilnya.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Order Card */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <p className="text-3xl font-bold text-primary" data-testid="text-price">
                    Rp {service.price.toLocaleString('id-ID')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Harga sudah termasuk revisi
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-muted/50">
                  <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>
                    <span className="font-medium">Waktu Pengerjaan:</span> {service.deliveryTime}
                  </span>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleOrderClick}
                  data-testid="button-order-now"
                >
                  Pesan Sekarang
                </Button>

                <div className="pt-4 border-t space-y-3">
                  <h3 className="font-semibold text-sm">Termasuk dalam paket:</h3>
                  <div className="space-y-2">
                    {service.features.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                    {service.features.length > 3 && (
                      <p className="text-sm text-muted-foreground pl-6">
                        +{service.features.length - 3} fitur lainnya
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Garansi kepuasan 100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Description Section - Desktop Only */}
        <div className="hidden md:block mt-12 px-4 md:px-0">
          <h2 className="text-2xl font-bold mb-4">Deskripsi Layanan</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed" data-testid="text-description">
              {service.description}
            </p>
          </div>
        </div>

        {/* Order Dialog */}
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogContent className="sm:max-w-md" data-testid="dialog-order">
            <DialogHeader>
              <DialogTitle>Konfirmasi Pesanan</DialogTitle>
              <DialogDescription>
                Pastikan detail pesanan Anda sudah benar sebelum melanjutkan.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Layanan:</p>
                <p className="text-sm text-muted-foreground">{service?.title}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Harga:</p>
                <p className="text-xl font-bold text-primary">
                  Rp {service?.price.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Waktu Pengerjaan:</p>
                <p className="text-sm text-muted-foreground">{service?.deliveryTime}</p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan Tambahan (Opsional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tambahkan catatan atau instruksi khusus untuk pesanan Anda..."
                            className="resize-none"
                            rows={4}
                            data-testid="input-notes"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOrderDialogOpen(false)}
                      disabled={orderMutation.isPending}
                      data-testid="button-cancel-order"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={orderMutation.isPending}
                      data-testid="button-confirm-order"
                    >
                      {orderMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Konfirmasi Pesanan
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}