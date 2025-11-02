import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { useParams } from "wouter";
import { getAllServices } from "@/lib/services";
import { createOrder } from "@/lib/orders";
import { validateVoucher, incrementVoucherUsage } from "@/lib/vouchers";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
  Minus,
  Plus,
  Loader2,
  Ticket,
  Check,
} from "lucide-react";
import type { Service, Voucher, InsertOrder } from "@shared/schema";
import { useMediaQuery } from 'usehooks-ts';

const orderFormSchema = z.object({
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
  voucherCode: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

export default function ServiceDetail() {
  const [, params] = useRoute("/layanan/:id");
  const [, setLocation] = useLocation();
  const serviceId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

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
      console.log("✅ Order created successfully:", order);
      setIsOrderDialogOpen(false);
      form.reset();
      setQuantity(1);
      setAppliedVoucher(null);
      setDiscountAmount(0);
      setVoucherCode("");

      toast({
        title: "Pesanan Berhasil Dibuat!",
        description: "Silakan lakukan pembayaran untuk melanjutkan pesanan Anda.",
      });

      // Redirect to order confirmation page
      setTimeout(() => {
        setLocation(`/pesanan/${order.id}`);
      }, 500);
    },
    onError: (error: any) => {
      console.error("❌ Order creation error:", error);
      toast({
        title: "Gagal Membuat Pesanan",
        description: error.message || "Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.",
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

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim() || !service) return;

    setIsCheckingVoucher(true);
    try {
      const validation = await validateVoucher(voucherCode.toUpperCase(), service.price * quantity);

      if (validation.valid && validation.voucher && validation.discountAmount) {
        setAppliedVoucher(validation.voucher);
        setDiscountAmount(validation.discountAmount);
        toast({
          title: "Voucher Diterapkan!",
          description: `Anda mendapat diskon Rp ${validation.discountAmount.toLocaleString("id-ID")}`,
        });
      } else {
        toast({
          title: "Voucher Tidak Valid",
          description: validation.message || "Kode voucher tidak dapat digunakan",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Gagal Memvalidasi Voucher",
        description: "Terjadi kesalahan saat memvalidasi voucher",
        variant: "destructive",
      });
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setDiscountAmount(0);
    setVoucherCode("");
  };

  const onSubmit = async (values: OrderFormData) => {
    if (!user || !service) {
      console.error("❌ Missing user or service");
      toast({
        title: "Error",
        description: "Data user atau layanan tidak tersedia",
        variant: "destructive",
      });
      return;
    }

    const originalPrice = service.price * quantity;
    const finalPrice = originalPrice - discountAmount;

    console.log("📝 Creating order with data:", {
      userId: user.id,
      serviceId: service.id,
      serviceName: service.title,
      originalPrice,
      finalPrice,
      quantity,
      discountAmount,
      voucherCode: appliedVoucher?.code,
    });

    try {
      const orderData: InsertOrder = {
        userId: user.id,
        serviceId: service.id,
        serviceName: service.title,
        originalPrice: originalPrice,
        servicePrice: finalPrice,
        finalPrice: finalPrice,
        status: "pending",
        paymentStatus: "waiting_payment",
        uploadAttempts: 0,
        ...(values.notes && { notes: values.notes }),
        ...(appliedVoucher?.code && { voucherCode: appliedVoucher.code }),
        ...(discountAmount > 0 && { discountAmount }),
      };

      console.log("📤 Submitting order data:", orderData);
      await orderMutation.mutateAsync(orderData);

      // Increment voucher usage after successful order creation
      if (appliedVoucher) {
        console.log("🎟️ Incrementing voucher usage:", appliedVoucher.code);
        await incrementVoucherUsage(appliedVoucher.id);
      }
    } catch (error) {
      console.error("❌ Order submission error:", error);
      // Error toast is handled by mutation onError
    }
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
    if (appliedVoucher) {
      handleRemoveVoucher();
    }
  };

  const decrementQuantity = () => {
    setQuantity(prev => prev > 1 ? prev - 1 : 1);
    if (appliedVoucher) {
      handleRemoveVoucher();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Skeleton className="h-10 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96 w-full rounded-lg" />
              <Skeleton className="h-40 w-full" />
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
      <div className="min-h-screen py-8 md:py-12 flex items-center justify-center">
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
    <div className="min-h-screen bg-background">
      {/* Mobile Layout - Shopee Style */}
      <div className="md:hidden pb-20">
        {/* Image with Overlay Back Button */}
        {service.imageUrl ? (
          <div className="relative aspect-square bg-gradient-to-br from-primary/10 via-orange-500/10 to-primary/20 flex items-center justify-center">
            <img
              src={service.imageUrl}
              alt={service.title}
              className="w-full h-full object-contain"
              data-testid="img-service"
            />
            {/* Overlay Back Button */}
            <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/40 to-transparent">
              <Link href="/layanan">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-white/90 hover:bg-white text-black shadow-md"
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative aspect-square bg-muted">
            <Package className="absolute inset-0 m-auto h-32 w-32 text-muted-foreground/20" />
            {/* Overlay Back Button */}
            <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/40 to-transparent">
              <Link href="/layanan">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-white/90 hover:bg-white text-black shadow-md"
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Title and Price */}
        <div className="bg-background px-4 py-3 space-y-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary" data-testid="text-price">
                Rp {service.price.toLocaleString('id-ID')}
              </span>
            </div>
            <h1 className="text-lg font-bold mt-1" data-testid="text-title">
              {service.title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < Math.floor(service.rating) ? 'fill-primary text-primary' : 'fill-muted text-muted'}`} />
                ))}
                <span className="ml-1 font-medium">{service.rating.toFixed(1)} / 5.0</span>
              </div>
              <span>•</span>
              <span>{service.orderCount}{service.orderCount > 0 ? '+' : ''} Pesanan</span>
            </div>
          </div>
        </div>

        {/* Estimated Time */}
        <div className="mx-4 mb-3">
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium">Waktu Pengerjaan: {service.deliveryTime}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <Card className="mx-4 mb-3">
          <CardHeader className="pb-2">
            <h2 className="text-sm font-semibold">Deskripsi Layanan</h2>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line" data-testid="text-description">
              {service.description}
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="mx-4 mb-3">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Yang Anda Dapatkan
            </h3>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-1.5">
              {service.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2" data-testid={`text-feature-${idx}`}>
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Guarantee */}
        <div className="mx-4 mb-3">
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" />
              Garansi kepuasan 100%
            </p>
          </div>
        </div>

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

      {/* Desktop Layout - Itemku Style */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/layanan">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          </Link>
        </div>

        {/* Main Content - Itemku Style Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Image & Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <Card className="overflow-hidden max-w-lg mx-auto bg-gradient-to-br from-primary/10 via-orange-500/10 to-primary/20 p-8">
              {service.imageUrl ? (
                <img
                  src={service.imageUrl}
                  alt={service.title}
                  className="w-full max-w-md mx-auto aspect-square object-contain"
                  data-testid="img-service"
                />
              ) : (
                <div className="w-full aspect-square bg-gradient-to-br from-primary/20 via-orange-600/20 to-primary/10 flex items-center justify-center">
                  <Package className="h-32 w-32 text-primary/30" />
                </div>
              )}
            </Card>

            {/* Tabs Navigation */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex gap-6 border-b">
                  <button className="pb-3 font-semibold text-primary border-b-2 border-primary">
                    Deskripsi Layanan
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Description */}
                <div>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line" data-testid="text-description">
                    {service.description}
                  </p>
                </div>

                {/* Features */}
                <div>
                  <h3 className="font-semibold mb-3">Yang Anda Dapatkan:</h3>
                  <div className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2"
                        data-testid={`text-feature-${idx}`}
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Card (Sticky) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardContent className="p-6 space-y-4">
                {/* Title & Category */}
                <div>
                  <h1 className="text-xl font-bold mb-2" data-testid="text-title">
                    {service.title}
                  </h1>
                  <Badge variant="secondary">{service.category}</Badge>
                </div>

                {/* Price */}
                <div className="py-4 border-y">
                  <p className="text-2xl font-bold text-primary" data-testid="text-price">
                    Rp {service.price.toLocaleString('id-ID')}
                  </p>
                </div>

                {/* Service Info */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Platform</span>
                    <span className="font-medium">Digital</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tipe Produk</span>
                    <span className="font-medium">{service.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Waktu Pengerjaan</span>
                    <span className="font-medium flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {service.deliveryTime}
                    </span>
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="py-4 border-y">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Jumlah:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={incrementQuantity}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="flex items-center justify-between py-3">
                  <span className="font-medium">Subtotal</span>
                  <span className="text-xl font-bold text-primary">
                    Rp {(service.price * quantity).toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Order Button */}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleOrderClick}
                  data-testid="button-order-now"
                >
                  Beli Langsung
                </Button>

                {/* Guarantee */}
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <Shield className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-xs text-green-900 dark:text-green-100">
                    Pembayaran Aman 100% Dijamin oleh Trade Guard
                  </p>
                </div>

                {/* Rating */}
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.floor(service.rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'}`} />
                      ))}
                    </div>
                    <span className="font-semibold">{service.rating.toFixed(1)} / 5.0</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{service.orderCount}{service.orderCount > 0 ? '+' : ''} Pesanan</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Order Dialog - Mobile (Drawer) */}
      {isMobile ? (
        <Drawer open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle>Konfirmasi Pesanan</DrawerTitle>
              <DrawerDescription>
                Pastikan detail pesanan Anda sudah benar sebelum melanjutkan.
              </DrawerDescription>
            </DrawerHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="px-4">
                <div className="space-y-3 overflow-y-auto max-h-[50vh] pb-4">
                  {/* Service Info */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Layanan:</p>
                    <p className="text-sm text-muted-foreground">{service?.title}</p>
                  </div>

                  {/* Quantity Selector */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Jumlah:</p>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={incrementQuantity}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Total Price */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Total Harga:</p>
                    <p className="text-xl font-bold text-primary">
                      Rp {(service?.price * quantity).toLocaleString('id-ID')}
                    </p>
                  </div>

                  {/* Voucher Section */}
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Ticket className="h-4 w-4" />
                      Kode Voucher (Opsional)
                    </p>
                    {!appliedVoucher ? (
                      <div className="flex gap-2">
                        <Input
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                          placeholder="Masukkan kode voucher"
                          className="uppercase"
                          data-testid="input-voucher-code"
                        />
                        <Button
                          type="button"
                          onClick={handleApplyVoucher}
                          disabled={!voucherCode.trim() || isCheckingVoucher}
                          size="sm"
                          data-testid="button-apply-voucher"
                        >
                          {isCheckingVoucher ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Gunakan"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="text-sm font-medium text-green-900 dark:text-green-100">{appliedVoucher.code}</p>
                            <p className="text-xs text-green-700 dark:text-green-300">
                              Diskon Rp {discountAmount.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveVoucher}
                          className="h-7"
                          data-testid="button-remove-voucher"
                        >
                          Hapus
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Final Price */}
                  {discountAmount > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>Rp {(service?.price * quantity).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Diskon Voucher</span>
                        <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Bayar</span>
                        <span className="text-primary">
                          Rp {((service?.price * quantity) - discountAmount).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Delivery Time */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Waktu Pengerjaan:</p>
                    <p className="text-sm text-muted-foreground">{service?.deliveryTime}</p>
                  </div>

                  {/* Notes Field */}
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
                            rows={3}
                            {...field}
                            data-testid="textarea-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DrawerFooter className="px-0 pt-4">
                  <Button
                    type="submit"
                    disabled={orderMutation.isPending}
                    data-testid="button-confirm-order"
                    className="w-full"
                  >
                    {orderMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Konfirmasi Pesanan
                  </Button>
                  <DrawerClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={orderMutation.isPending}
                      data-testid="button-cancel-order"
                      className="w-full"
                    >
                      Batal
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </Form>
          </DrawerContent>
        </Drawer>
      ) : (
        /* Order Dialog - Desktop */
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <div className="max-h-[80vh] overflow-y-auto px-1">
              <DialogHeader>
                <DialogTitle>Konfirmasi Pesanan</DialogTitle>
                <DialogDescription>
                  Pastikan detail pesanan Anda sudah benar sebelum melanjutkan.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Layanan:</p>
                      <p className="text-sm text-muted-foreground">{service?.title}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Jumlah:</p>
                      <p className="text-sm text-muted-foreground">{quantity}x</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Total Harga:</p>
                      <p className="text-xl font-bold text-primary">
                        Rp {(service?.price * quantity).toLocaleString('id-ID')}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Waktu Pengerjaan:</p>
                      <p className="text-sm text-muted-foreground">{service?.deliveryTime}</p>
                    </div>
                  </div>

                  {/* Voucher Section */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Ticket className="h-4 w-4" />
                      Kode Voucher (Opsional)
                    </p>
                    {!appliedVoucher ? (
                      <div className="flex gap-2">
                        <Input
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                          placeholder="Masukkan kode voucher"
                          className="uppercase"
                          data-testid="input-voucher-code-desktop"
                        />
                        <Button
                          type="button"
                          onClick={handleApplyVoucher}
                          disabled={!voucherCode.trim() || isCheckingVoucher}
                          size="sm"
                          data-testid="button-apply-voucher-desktop"
                        >
                          {isCheckingVoucher ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Gunakan"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="text-sm font-medium text-green-900 dark:text-green-100">{appliedVoucher.code}</p>
                            <p className="text-xs text-green-700 dark:text-green-300">
                              Diskon Rp {discountAmount.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveVoucher}
                          className="h-7"
                          data-testid="button-remove-voucher-desktop"
                        >
                          Hapus
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Final Price */}
                  {discountAmount > 0 && (
                    <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>Rp {(service?.price * quantity).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Diskon Voucher</span>
                        <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total Bayar</span>
                        <span className="text-primary">
                          Rp {((service?.price * quantity) - discountAmount).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}

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
                            {...field}
                            data-testid="textarea-notes"
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
      )}
    </div>
  );
}