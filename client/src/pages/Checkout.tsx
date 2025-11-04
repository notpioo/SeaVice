import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { getAllServices } from "@/lib/services";
import { createOrder } from "@/lib/orders";
import { validateVoucher } from "@/lib/vouchers";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  ArrowLeft,
  CheckCircle2,
  Ticket,
  Gift,
  Loader2,
  Tag,
  CreditCard,
  Smartphone,
  Wallet,
} from "lucide-react";
import type { Service, Voucher } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

const checkoutFormSchema = z.object({
  customerWhatsapp: z
    .string()
    .min(10, "Nomor WhatsApp minimal 10 digit")
    .regex(/^(\+62|62|0)[0-9]{9,12}$/, "Format nomor WhatsApp tidak valid (contoh: 081234567890)"),
  customerNotes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
  voucherCode: z.string().optional(),
  usePoints: z.boolean().default(false),
  pointsToUse: z.number().min(0).optional(),
  referralCode: z.string().optional(),
  paymentMethod: z.enum(["sealdo", "qris"]),
});

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

export default function Checkout() {
  const [, params] = useRoute("/checkout/:serviceId");
  const [, setLocation] = useLocation();
  const serviceId = params?.serviceId;
  const { user } = useAuth();
  const { toast } = useToast();

  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  const [usePoints, setUsePoints] = useState(false);

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: getAllServices,
  });

  const service = services?.find(s => s.id === serviceId);
  const userPoints = user?.loyaltyPoints || 0;
  const pointsValue = 1000; // 1000 points = Rp 1
  const maxPointsToUse = Math.min(userPoints, Math.floor((service?.price || 0) * 0.5) * pointsValue); // Max 50% dari harga, converted to points

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerWhatsapp: user?.phone || "",
      customerNotes: "",
      voucherCode: "",
      usePoints: false,
      pointsToUse: 0,
      referralCode: "",
      paymentMethod: "sealdo",
    },
  });

  const voucherCode = form.watch("voucherCode");
  const pointsToUse = usePoints ? maxPointsToUse : 0;

  // Calculate prices
  const originalPrice = service?.price || 0;
  const voucherDiscount = appliedVoucher
    ? appliedVoucher.discountType === "percentage"
      ? Math.min(
          (originalPrice * appliedVoucher.discountValue) / 100,
          appliedVoucher.maxDiscount || Infinity
        )
      : appliedVoucher.discountValue
    : 0;
  const pointsDiscount = Math.floor(pointsToUse / pointsValue);
  const finalPrice = Math.max(0, originalPrice - voucherDiscount - pointsDiscount);

  const orderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      toast({
        title: "Pesanan Berhasil Dibuat!",
        description: "Silakan lakukan pembayaran untuk melanjutkan pesanan Anda.",
      });
      
      setLocation(`/pesanan/${order.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Membuat Pesanan",
        description: error.message || "Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.",
        variant: "destructive",
      });
    },
  });

  const handleCheckVoucher = async () => {
    if (!voucherCode?.trim()) {
      setVoucherError("");
      setAppliedVoucher(null);
      return;
    }

    setIsCheckingVoucher(true);
    setVoucherError("");

    try {
      const result = await validateVoucher(voucherCode, originalPrice);
      
      if (!result.valid || !result.voucher) {
        setVoucherError(result.message || "Voucher tidak valid");
        setAppliedVoucher(null);
        return;
      }
      
      setAppliedVoucher(result.voucher);
      toast({
        title: "Voucher Berhasil Diterapkan!",
        description: `Anda mendapat diskon ${
          result.voucher.discountType === "percentage"
            ? `${result.voucher.discountValue}%`
            : `Rp ${result.voucher.discountValue.toLocaleString("id-ID")}`
        }`,
      });
    } catch (error: any) {
      setVoucherError(error.message || "Terjadi kesalahan");
      setAppliedVoucher(null);
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    form.setValue("voucherCode", "");
    setAppliedVoucher(null);
    setVoucherError("");
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (!service || !user) return;

    // Validasi SeaLdo jika metode pembayaran SeaLdo
    if (data.paymentMethod === "sealdo") {
      const userSealdo = user.sealdo || 0;
      if (userSealdo < finalPrice) {
        toast({
          title: "SeaLdo Tidak Cukup",
          description: `Saldo Anda: Rp ${userSealdo.toLocaleString("id-ID")}. Diperlukan: Rp ${finalPrice.toLocaleString("id-ID")}`,
          variant: "destructive",
        });
        return;
      }
    }

    const orderData: any = {
      userId: user.id,
      serviceId: service.id,
      serviceName: service.title,
      originalPrice: originalPrice,
      servicePrice: finalPrice,
      finalPrice: finalPrice,
      paymentMethod: data.paymentMethod,
      customerWhatsapp: data.customerWhatsapp,
      status: "pending" as const,
      paymentStatus: "waiting_payment" as const,
      uploadAttempts: 0,
    };

    // Only add optional fields if they have values
    if (appliedVoucher?.code) {
      orderData.voucherCode = appliedVoucher.code;
    }
    if (voucherDiscount > 0) {
      orderData.discountAmount = voucherDiscount;
    }
    if (pointsToUse > 0) {
      orderData.pointsUsed = pointsToUse;
    }
    if (pointsDiscount > 0) {
      orderData.pointsDiscount = pointsDiscount;
    }
    if (data.referralCode?.trim()) {
      orderData.referralCode = data.referralCode.trim();
    }
    if (data.customerNotes?.trim()) {
      orderData.customerNotes = data.customerNotes.trim();
    }

    orderMutation.mutate(orderData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Layanan tidak ditemukan</p>
          <Button onClick={() => setLocation("/layanan")} data-testid="button-back-services">
            Kembali ke Layanan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(`/layanan/${serviceId}`)}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Checkout</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column - Forms */}
              <div className="lg:col-span-2 space-y-4">
                {/* Detail Pesanan */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      Detail Pesanan
                    </h2>
                    <div className="flex gap-4">
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt={service.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white" data-testid="text-service-name">
                          {service.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {service.description}
                        </p>
                        <p className="text-lg font-bold text-primary mt-2" data-testid="text-service-price">
                          Rp {service.price.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Informasi Pembeli */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Informasi Pembeli
                    </h2>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="customerWhatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nomor WhatsApp*</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="081234567890"
                                {...field}
                                data-testid="input-whatsapp"
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Digunakan untuk konfirmasi pesanan
                            </p>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="customerNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Catatan untuk Penjual (Opsional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Contoh: Tolong dikerjakan secepatnya..."
                                className="min-h-[100px]"
                                {...field}
                                data-testid="input-notes"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Voucher */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Ticket className="h-5 w-5 text-primary" />
                      Voucher Diskon
                    </h2>
                    {appliedVoucher ? (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-100 dark:bg-green-800 p-2 rounded-lg">
                              <Ticket className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-green-900 dark:text-green-100">
                                {appliedVoucher.code}
                              </p>
                              <p className="text-sm text-green-700 dark:text-green-300">
                                Diskon{" "}
                                {appliedVoucher.discountType === "percentage"
                                  ? `${appliedVoucher.discountValue}%`
                                  : `Rp ${appliedVoucher.discountValue.toLocaleString("id-ID")}`}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveVoucher}
                            data-testid="button-remove-voucher"
                          >
                            Hapus
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="voucherCode"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input
                                    placeholder="Masukkan kode voucher"
                                    {...field}
                                    data-testid="input-voucher"
                                    className="uppercase"
                                    onChange={(e) => {
                                      field.onChange(e.target.value.toUpperCase());
                                      setVoucherError("");
                                    }}
                                  />
                                </FormControl>
                                <Button
                                  type="button"
                                  onClick={handleCheckVoucher}
                                  disabled={isCheckingVoucher || !voucherCode?.trim()}
                                  data-testid="button-apply-voucher"
                                >
                                  {isCheckingVoucher ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Pakai"
                                  )}
                                </Button>
                              </div>
                              {voucherError && (
                                <p className="text-sm text-red-500 dark:text-red-400">{voucherError}</p>
                              )}
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tukar Poin & Referal */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    {/* Tukar Poin */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Gift className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            Tukar Poin
                          </h3>
                        </div>
                        <FormField
                          control={form.control}
                          name="usePoints"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Switch
                                  checked={usePoints}
                                  onCheckedChange={(checked) => {
                                    setUsePoints(checked);
                                    field.onChange(checked);
                                  }}
                                  data-testid="switch-use-points"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Poin tersedia: {userPoints.toLocaleString("id-ID")} poin (Rp{" "}
                        {Math.floor(userPoints / pointsValue).toLocaleString("id-ID")})
                      </p>
                      {usePoints && (
                        <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                          <p className="text-sm text-blue-900 dark:text-blue-100">
                            Menggunakan {maxPointsToUse.toLocaleString("id-ID")} poin = Rp{" "}
                            {pointsDiscount.toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Maksimal 50% dari harga layanan
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Kode Referal */}
                    <FormField
                      control={form.control}
                      name="referralCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-primary" />
                            Kode Referal (Opsional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Masukkan kode referal"
                              {...field}
                              data-testid="input-referral"
                              className="uppercase"
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Dapatkan bonus poin jika menggunakan kode referal
                          </p>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Metode Pembayaran */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Metode Pembayaran
                    </h2>
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-3">
                            <div
                              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                field.value === "sealdo"
                                  ? "border-primary bg-primary/5"
                                  : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                              }`}
                              onClick={() => field.onChange("sealdo")}
                              data-testid="option-sealdo"
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg">
                                  <Wallet className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    SeaLdo
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Saldo: Rp {(user?.sealdo || 0).toLocaleString("id-ID")}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div
                              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                field.value === "qris"
                                  ? "border-primary bg-primary/5"
                                  : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                              }`}
                              onClick={() => field.onChange("qris")}
                              data-testid="option-qris"
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg">
                                  <Smartphone className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white">QRIS</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Semua aplikasi pembayaran
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* QRIS Info */}
                    {form.watch("paymentMethod") === "qris" && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-2 text-sm text-blue-900 dark:text-blue-100">
                          <span className="text-blue-600 dark:text-blue-400 mt-0.5">ℹ️</span>
                          <p>
                            Setelah pesanan dibuat, Anda akan melihat kode QR untuk pembayaran. Scan kode tersebut dengan aplikasi pembayaran Anda.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Summary (Desktop Only) */}
              <div className="hidden lg:block lg:col-span-1">
                <Card className="sticky top-24">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Rincian Pembayaran
                    </h2>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                        <span className="font-medium text-gray-900 dark:text-white" data-testid="text-subtotal">
                          Rp {originalPrice.toLocaleString("id-ID")}
                        </span>
                      </div>
                      {voucherDiscount > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>Diskon Voucher</span>
                          <span data-testid="text-voucher-discount">
                            -Rp {voucherDiscount.toLocaleString("id-ID")}
                          </span>
                        </div>
                      )}
                      {pointsDiscount > 0 && (
                        <div className="flex justify-between text-blue-600 dark:text-blue-400">
                          <span>Diskon Poin</span>
                          <span data-testid="text-points-discount">
                            -Rp {pointsDiscount.toLocaleString("id-ID")}
                          </span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-gray-900 dark:text-white">Total Pembayaran</span>
                        <span className="text-primary" data-testid="text-final-price">
                          Rp {finalPrice.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full mt-6"
                      disabled={orderMutation.isPending}
                      data-testid="button-checkout"
                    >
                      {orderMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        "Buat Pesanan"
                      )}
                    </Button>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                      Dengan melanjutkan, Anda menyetujui syarat dan ketentuan yang berlaku
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Add padding bottom for mobile to prevent content being hidden by bottom bar */}
            <div className="h-24 lg:hidden"></div>
          </form>
        </Form>

        {/* Bottom Bar - Mobile Only */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              {/* Total & Hemat */}
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
                  <span className="text-lg font-bold text-primary" data-testid="text-final-price-mobile">
                    Rp {finalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                {(voucherDiscount > 0 || pointsDiscount > 0) && (
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <span>Hemat</span>
                    <span className="font-semibold" data-testid="text-total-savings-mobile">
                      Rp {(voucherDiscount + pointsDiscount).toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
              </div>

              {/* Button */}
              <Button
                type="submit"
                size="lg"
                className="px-6"
                disabled={orderMutation.isPending}
                onClick={form.handleSubmit(onSubmit)}
                data-testid="button-checkout-mobile"
              >
                {orderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Buat Pesanan"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
