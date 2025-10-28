import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getOrderById } from "@/lib/orders";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  Clock, 
  Package,
  ArrowRight,
  Calendar,
  Ticket
} from "lucide-react";
import type { Order } from "@shared/schema";

export default function OrderConfirmation() {
  const [, params] = useRoute("/pesanan/:orderId");
  const orderId = params?.orderId;

  const { data: order, isLoading } = useQuery<Order | null>({
    queryKey: ["order", orderId],
    queryFn: () => orderId ? getOrderById(orderId) : null,
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-16 md:py-24 flex items-center justify-center">
        <div className="max-w-2xl w-full px-4 md:px-8">
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

  const getHeaderInfo = () => {
    const paymentStatus = order?.paymentStatus;
    
    if (paymentStatus === "waiting_payment") {
      return {
        icon: <Clock className="h-10 w-10 text-amber-500" />,
        title: "Menunggu Pembayaran",
        description: "Silakan lakukan pembayaran untuk melanjutkan pesanan Anda.",
        bgColor: "bg-amber-500/10"
      };
    } else if (paymentStatus === "waiting_confirmation") {
      return {
        icon: <Clock className="h-10 w-10 text-blue-500" />,
        title: "Menunggu Konfirmasi Pembayaran",
        description: "Bukti pembayaran Anda sedang diverifikasi oleh admin.",
        bgColor: "bg-blue-500/10"
      };
    } else if (paymentStatus === "confirmed") {
      return {
        icon: <CheckCircle2 className="h-10 w-10 text-green-500" />,
        title: "Pembayaran Dikonfirmasi",
        description: "Pembayaran Anda telah dikonfirmasi. Pesanan sedang diproses.",
        bgColor: "bg-green-500/10"
      };
    } else if (paymentStatus === "rejected") {
      return {
        icon: <Package className="h-10 w-10 text-red-500" />,
        title: "Pembayaran Ditolak",
        description: "Bukti pembayaran ditolak. Silakan hubungi admin untuk informasi lebih lanjut.",
        bgColor: "bg-red-500/10"
      };
    }
    
    return {
      icon: <CheckCircle2 className="h-10 w-10 text-primary" />,
      title: "Pesanan Berhasil Dibuat!",
      description: "Terima kasih atas pesanan Anda. Kami akan segera memprosesnya.",
      bgColor: "bg-primary/10"
    };
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="min-h-screen py-8 md:py-12 overflow-x-hidden">
      <div className="max-w-2xl mx-auto px-4 md:px-8 overflow-x-hidden w-full">
        {/* Header Icon */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center h-20 w-20 rounded-full ${headerInfo.bgColor} mb-4`}>
            {headerInfo.icon}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {headerInfo.title}
          </h1>
          <p className="text-muted-foreground">
            {headerInfo.description}
          </p>
        </div>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold mb-1">Detail Pesanan</h2>
                <p className="text-sm text-muted-foreground break-all">
                  ID Pesanan: <span className="font-mono" data-testid="text-order-id">{order.id}</span>
                </p>
              </div>
              <div className="shrink-0">
                {getStatusBadge(order.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Service Info */}
            <div>
              <h3 className="font-medium mb-3">Layanan</h3>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium mb-1" data-testid="text-service-name">
                  {order.serviceName}
                </p>
                <div className="space-y-2 mt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Harga</span>
                    <span data-testid="text-original-price">
                      Rp {order.originalPrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                  
                  {order.voucherCode && order.discountAmount && order.discountAmount > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span className="flex items-center gap-1">
                          <Ticket className="h-3 w-3" />
                          Diskon ({order.voucherCode})
                        </span>
                        <span data-testid="text-discount">
                          - Rp {order.discountAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total Bayar</span>
                        <span className="text-primary" data-testid="text-final-price">
                          Rp {order.finalPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {(!order.voucherCode || !order.discountAmount || order.discountAmount === 0) && (
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total Bayar</span>
                      <span className="text-primary" data-testid="text-final-price">
                        Rp {order.finalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Date */}
            <div>
              <h3 className="font-medium mb-3">Tanggal Pesanan</h3>
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
            </div>

            {/* Notes */}
            {order.notes && (
              <div>
                <h3 className="font-medium mb-3">Catatan</h3>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground" data-testid="text-notes">
                    {order.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-3">Langkah Selanjutnya</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tim kami akan meninjau pesanan Anda</p>
                    <p className="text-sm text-muted-foreground">Biasanya dalam 1-2 jam kerja</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Kami akan segera memulai pengerjaan</p>
                    <p className="text-sm text-muted-foreground">Anda akan mendapat notifikasi saat status berubah</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Pekerjaan selesai dan siap digunakan</p>
                    <p className="text-sm text-muted-foreground">Anda dapat melihat hasilnya di dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {order.paymentStatus === "waiting_payment" && (
            <Link href={`/payment/${order.id}`} className="flex-1 w-full">
              <Button className="w-full" data-testid="button-payment">
                Lanjut ke Pembayaran
              </Button>
            </Link>
          )}
          {order.paymentStatus !== "waiting_payment" && (
            <>
              <Link href="/" className="flex-1 w-full">
                <Button className="w-full" data-testid="button-home">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Kembali ke Home
                </Button>
              </Link>
              <Link href="/layanan" className="flex-1 w-full">
                <Button variant="outline" className="w-full" data-testid="button-browse-services">
                  Lihat Layanan Lainnya
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}