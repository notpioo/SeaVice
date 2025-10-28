
import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getOrderById } from "@/lib/orders";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

export default function Payment() {
  const [, params] = useRoute("/payment/:orderId");
  const [, setLocation] = useLocation();
  const orderId = params?.orderId;
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const { data: order, isLoading } = useQuery({
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

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bukti Pembayaran Terkirim",
        description: "Bukti pembayaran Anda sedang diverifikasi oleh admin",
      });
      setLocation(`/pesanan/${orderId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({
        title: "Pilih Bukti Pembayaran",
        description: "Silakan pilih file gambar bukti pembayaran",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate(selectedFile);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-16 md:py-24 flex items-center justify-center">
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen py-16 md:py-24 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Pesanan Tidak Ditemukan</h2>
          <Link href="/pesanan">
            <Button>Kembali ke Pesanan</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (order.paymentStatus === "waiting_confirmation" || order.paymentStatus === "confirmed") {
    return (
      <div className="min-h-screen py-16 md:py-24 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Bukti Pembayaran Sudah Dikirim</h2>
          <p className="text-muted-foreground mb-6">
            {order.paymentStatus === "confirmed" 
              ? "Pembayaran Anda sudah dikonfirmasi"
              : "Menunggu konfirmasi dari admin"}
          </p>
          <Link href={`/pesanan/${orderId}`}>
            <Button>Lihat Detail Pesanan</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="max-w-2xl mx-auto px-4 md:px-8">
        {/* Back Button */}
        <Link href={`/pesanan/${orderId}`}>
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mb-4">
            <Clock className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Konfirmasi Pembayaran
          </h1>
          <p className="text-muted-foreground">
            Scan QRIS dan upload bukti pembayaran Anda
          </p>
        </div>

        {/* Order Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detail Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Layanan</span>
              <span className="font-medium">{order.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID Pesanan</span>
              <span className="font-mono text-sm">{order.id}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total Pembayaran</span>
              <span className="text-primary">
                Rp {order.finalPrice.toLocaleString("id-ID")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* QRIS Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Scan QRIS untuk Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-6 flex items-center justify-center">
              {/* Placeholder for QRIS image - admin will upload this */}
              <img
                src="/qris-payment.png"
                alt="QRIS Payment"
                className="max-w-full h-auto max-h-96"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/300x300?text=QRIS+Payment";
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Scan kode QR di atas menggunakan aplikasi mobile banking atau e-wallet Anda
            </p>
          </CardContent>
        </Card>

        {/* Upload Proof Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Bukti Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="payment-proof">
                  Pilih Gambar Bukti Transfer (Max 5MB)
                </Label>
                <Input
                  id="payment-proof"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-2"
                  disabled={uploadMutation.isPending}
                />
              </div>

              {previewUrl && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full h-auto max-h-64 mx-auto rounded"
                  />
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  <strong>Penting:</strong> Pastikan bukti transfer terlihat jelas, termasuk:
                </p>
                <ul className="text-sm text-amber-900 dark:text-amber-100 list-disc list-inside mt-2 space-y-1">
                  <li>Jumlah yang ditransfer</li>
                  <li>Tanggal dan waktu transfer</li>
                  <li>Nama penerima</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!selectedFile || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Kirim Bukti Pembayaran
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
