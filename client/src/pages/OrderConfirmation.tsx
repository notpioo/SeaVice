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
          {order.status === "processing" && order.paymentStatus === "confirmed" && (
            <a 
              href="https://wa.me/6285709557572" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex-1 w-full"
            >
              <Button className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800" data-testid="button-whatsapp">
                <svg 
                  className="mr-2 h-4 w-4" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Hubungi via WhatsApp
              </Button>
            </a>
          )}
          {order.paymentStatus !== "waiting_payment" && !(order.status === "processing" && order.paymentStatus === "confirmed") && (
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