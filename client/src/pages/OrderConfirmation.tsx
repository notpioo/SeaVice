import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getOrderById, updateOrderPaymentProof } from "@/lib/orders";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  Clock, 
  Package,
  ArrowRight,
  Calendar,
  Ticket,
  Upload,
  Copy,
  Check,
  AlertCircle,
  Home,
  ChevronRight,
  Loader2,
  CreditCard,
  Building2,
  QrCode,
  ImageIcon
} from "lucide-react";
import type { Order } from "@shared/schema";

export default function OrderConfirmation() {
  const [, params] = useRoute("/pesanan/:orderId");
  const [, setLocation] = useLocation();
  const orderId = params?.orderId;
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const { data: order, isLoading } = useQuery<Order | null>({
    queryKey: ["order", orderId],
    queryFn: () => orderId ? getOrderById(orderId) : null,
    enabled: !!orderId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orderId", orderId!);

      const response = await fetch("/api/upload-payment-proof", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Gagal mengupload bukti pembayaran");
      }

      const data = await response.json();
      await updateOrderPaymentProof(orderId!, data.imageUrl);
      return data;
    },
    onSuccess: async () => {
      setSelectedFile(null);
      setPreviewUrl("");
      
      // Refetch the order to get fresh data including updated uploadAttempts
      await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      
      // Wait for refetch to complete
      await queryClient.refetchQueries({ queryKey: ["order", orderId] });

      toast({
        title: "Bukti Pembayaran Terkirim",
        description: "Bukti pembayaran sedang diverifikasi oleh admin. Biasanya memakan waktu 1-2 jam kerja.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Countdown timer - 24 hours from order creation
  useEffect(() => {
    if (!order?.orderDate) return;

    const updateTimer = () => {
      const orderTime = new Date(order.orderDate).getTime();
      const deadline = orderTime + (24 * 60 * 60 * 1000); // 24 hours
      const now = Date.now();
      const remaining = Math.max(0, deadline - now);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order?.orderDate]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Disalin!",
      description: `${field} telah disalin ke clipboard`,
    });
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Terlalu Besar",
          description: "Ukuran file maksimal 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Format File Tidak Valid",
          description: "Hanya file gambar yang diperbolehkan",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: "Pilih Bukti Pembayaran",
        description: "Silakan pilih file gambar bukti pembayaran",
        variant: "destructive",
      });
      return;
    }

    const currentAttempts = order?.uploadAttempts || 0;
    if (currentAttempts >= 5) {
      toast({
        title: "Batas Upload Tercapai",
        description: "Anda telah mencapai batas maksimal upload.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(selectedFile);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-16 md:py-24 flex items-center justify-center">
        <div className="max-w-4xl w-full px-4 md:px-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen py-16 md:py-24 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-muted mb-6">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Pesanan Tidak Ditemukan</h2>
          <p className="text-muted-foreground mb-6">
            Pesanan yang Anda cari tidak tersedia.
          </p>
          <Link href="/home">
            <Button data-testid="button-back-home">
              Kembali ke Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      processing: "default",
      completed: "default",
      cancelled: "destructive",
    };

    const labels: Record<string, string> = {
      pending: "Menunggu Konfirmasi",
      processing: "Sedang Dikerjakan",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    };

    return (
      <Badge variant={variants[status] || "secondary"} data-testid="badge-status">
        {labels[status] || status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus?: string) => {
    if (!paymentStatus) return null;

    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      waiting_payment: "secondary",
      waiting_confirmation: "default",
      confirmed: "default",
      rejected: "destructive",
    };

    const labels: Record<string, string> = {
      waiting_payment: "Menunggu Pembayaran",
      waiting_confirmation: "Menunggu Konfirmasi",
      confirmed: "Pembayaran Dikonfirmasi",
      rejected: "Pembayaran Ditolak",
    };

    return (
      <Badge variant={variants[paymentStatus] || "secondary"} className="ml-2">
        {labels[paymentStatus] || paymentStatus}
      </Badge>
    );
  };

  const getCurrentStep = () => {
    if (order.paymentStatus === "waiting_payment") return 1;
    if (order.paymentStatus === "waiting_confirmation") return 2;
    if (order.paymentStatus === "confirmed" || order.status === "processing") return 3;
    if (order.status === "completed") return 4;
    return 1;
  };

  const currentStep = getCurrentStep();

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/pesanan" className="hover:text-foreground transition-colors">
            Riwayat Pesanan
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Detail Pesanan</span>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: "Pesan", icon: Package },
              { step: 2, label: "Bayar", icon: CreditCard },
              { step: 3, label: "Konfirmasi", icon: Clock },
              { step: 4, label: "Selesai", icon: CheckCircle2 },
            ].map(({ step, label, icon: Icon }, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      currentStep >= step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className={`text-xs mt-2 font-medium ${
                    currentStep >= step ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {label}
                  </p>
                </div>
                {index < 3 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded ${
                      currentStep > step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Success Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center h-20 w-20 rounded-full mb-4 ${
            order.paymentStatus === "waiting_payment" ? "bg-amber-500/10" :
            order.paymentStatus === "waiting_confirmation" ? "bg-blue-500/10" :
            order.paymentStatus === "confirmed" ? "bg-green-500/10" :
            order.paymentStatus === "rejected" ? "bg-red-500/10" :
            "bg-primary/10"
          }`}>
            {order.paymentStatus === "waiting_payment" && <Clock className="h-10 w-10 text-amber-500" />}
            {order.paymentStatus === "waiting_confirmation" && <Clock className="h-10 w-10 text-blue-500" />}
            {order.paymentStatus === "confirmed" && <CheckCircle2 className="h-10 w-10 text-green-500" />}
            {order.paymentStatus === "rejected" && <AlertCircle className="h-10 w-10 text-red-500" />}
            {!order.paymentStatus && <CheckCircle2 className="h-10 w-10 text-primary" />}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {order.paymentStatus === "waiting_payment" && "Pesanan Berhasil Dibuat!"}
            {order.paymentStatus === "waiting_confirmation" && "Menunggu Konfirmasi"}
            {order.paymentStatus === "confirmed" && "Pembayaran Dikonfirmasi"}
            {order.paymentStatus === "rejected" && "Pembayaran Ditolak"}
            {!order.paymentStatus && "Pesanan Berhasil"}
          </h1>
          <p className="text-muted-foreground">
            {order.paymentStatus === "waiting_payment" && "Silakan lakukan pembayaran untuk melanjutkan pesanan Anda"}
            {order.paymentStatus === "waiting_confirmation" && "Bukti pembayaran Anda sedang diverifikasi oleh admin"}
            {order.paymentStatus === "confirmed" && "Pembayaran berhasil dikonfirmasi, pesanan sedang diproses"}
            {order.paymentStatus === "rejected" && "Bukti pembayaran ditolak, silakan upload ulang"}
          </p>
        </div>

        {/* Countdown Timer */}
        {order.paymentStatus === "waiting_payment" && timeRemaining > 0 && (
          <Card className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100">Selesaikan Pembayaran Dalam</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Pesanan akan dibatalkan otomatis jika waktu habis</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {formatTime(timeRemaining)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl">Detail Pesanan</CardTitle>
                    <p className="text-sm text-muted-foreground break-all mt-1">
                      ID: <span className="font-mono" data-testid="text-order-id">{order.id}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {getStatusBadge(order.status)}
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Service Info */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="font-medium mb-1" data-testid="text-service-name">
                    {order.serviceName}
                  </p>
                  <div className="space-y-2 mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Harga</span>
                      <span data-testid="text-original-price">
                        Rp {order.originalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    {order.voucherCode && order.discountAmount && order.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span className="flex items-center gap-1">
                          <Ticket className="h-3 w-3" />
                          Diskon ({order.voucherCode})
                        </span>
                        <span data-testid="text-discount">
                          - Rp {order.discountAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total Bayar</span>
                      <span className="text-primary" data-testid="text-final-price">
                        Rp {order.finalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span data-testid="text-order-date">
                    {new Date(order.orderDate).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div>
                    <h3 className="font-medium mb-2">Catatan</h3>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground" data-testid="text-notes">
                        {order.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {order.rejectionReason && order.paymentStatus === "rejected" && (
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-900 dark:text-red-100 mb-1">Alasan Penolakan</p>
                        <p className="text-sm text-red-700 dark:text-red-300">{order.rejectionReason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Instructions - Only show if waiting for payment */}
            {order.paymentStatus === "waiting_payment" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Instruksi Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Bank Transfer */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Transfer Bank</h3>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Nama Bank</Label>
                        <p className="font-medium">Bank BCA</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Nomor Rekening</Label>
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-medium">1234567890</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard("1234567890", "Nomor Rekening")}
                          >
                            {copiedField === "Nomor Rekening" ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Atas Nama</Label>
                        <p className="font-medium">PT SeaVice Indonesia</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Jumlah Transfer</Label>
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-bold text-lg text-primary">
                            Rp {order.finalPrice.toLocaleString('id-ID')}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(order.finalPrice.toString(), "Jumlah")}
                          >
                            {copiedField === "Jumlah" ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QRIS */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <QrCode className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Atau Scan QRIS</h3>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-center">
                      <div className="bg-white p-4 rounded-lg mb-2">
                        <img
                          src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SeaVice-Payment-Demo"
                          alt="QRIS Code"
                          className="w-48 h-48"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Scan QR code dengan aplikasi pembayaran Anda
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>Penting:</strong> Setelah transfer, jangan lupa upload bukti pembayaran di sebelah kanan
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Upload Section */}
          <div className="lg:col-span-1">
            {order.paymentStatus === "waiting_payment" && (
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Upload className="h-5 w-5" />
                    Upload Bukti Bayar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                      <Label htmlFor="payment-proof">Bukti Pembayaran</Label>
                      <div className="mt-2">
                        <Input
                          id="payment-proof"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="cursor-pointer"
                          data-testid="input-payment-proof"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Format: JPG, PNG (Max 5MB)
                      </p>
                    </div>

                    {previewUrl && (
                      <div className="rounded-lg border p-2">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-auto rounded"
                        />
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!selectedFile || uploadMutation.isPending}
                      data-testid="button-upload"
                    >
                      {uploadMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Mengupload...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Kirim Bukti Pembayaran
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Sisa percobaan: {5 - (order.uploadAttempts || 0)} kali
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}

            {order.paymentStatus === "waiting_confirmation" && (
              <Card className="sticky top-6">
                <CardContent className="pt-6 text-center">
                  <Clock className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Sedang Diverifikasi</h3>
                  <p className="text-sm text-muted-foreground">
                    Bukti pembayaran Anda sedang diverifikasi oleh tim kami. Biasanya memakan waktu 1-2 jam kerja.
                  </p>
                </CardContent>
              </Card>
            )}

            {order.paymentStatus === "confirmed" && (
              <Card className="sticky top-6">
                <CardContent className="pt-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Pembayaran Dikonfirmasi</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pesanan Anda sedang diproses oleh tim kami.
                  </p>
                  {order.status === "processing" && (
                    <a 
                      href="https://wa.me/6285709557572" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button className="w-full bg-green-600 hover:bg-green-700" data-testid="button-whatsapp">
                        <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        Hubungi via WhatsApp
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {order.paymentStatus === "rejected" && (
              <Card className="sticky top-6 border-red-500/50">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2 text-red-900 dark:text-red-100">Upload Ulang</h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Silakan upload bukti pembayaran yang benar
                    </p>
                  </div>
                  
                  <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                      <Label htmlFor="payment-proof-retry">Bukti Pembayaran</Label>
                      <div className="mt-2">
                        <Input
                          id="payment-proof-retry"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>

                    {previewUrl && (
                      <div className="rounded-lg border p-2">
                        <img src={previewUrl} alt="Preview" className="w-full h-auto rounded" />
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!selectedFile || uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Mengupload...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Ulang
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Sisa percobaan: {5 - (order.uploadAttempts || 0)} kali
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Link href="/pesanan" className="flex-1">
            <Button variant="outline" className="w-full" data-testid="button-orders">
              Lihat Riwayat Pesanan
            </Button>
          </Link>
          <Link href="/layanan" className="flex-1">
            <Button variant="outline" className="w-full" data-testid="button-browse-services">
              <ArrowRight className="mr-2 h-4 w-4" />
              Lihat Layanan Lainnya
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
