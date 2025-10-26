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
  Calendar
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

  return (
    <div className="min-h-screen py-16 md:py-24">
      <div className="max-w-2xl mx-auto px-4 md:px-8">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mb-4">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Pesanan Berhasil Dibuat!
          </h1>
          <p className="text-muted-foreground">
            Terima kasih atas pesanan Anda. Kami akan segera memprosesnya.
          </p>
        </div>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">Detail Pesanan</h2>
                <p className="text-sm text-muted-foreground">
                  ID Pesanan: <span className="font-mono" data-testid="text-order-id">{order.id}</span>
                </p>
              </div>
              {getStatusBadge(order.status)}
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
                <p className="text-2xl font-bold text-primary" data-testid="text-service-price">
                  Rp {order.servicePrice.toLocaleString('id-ID')}
                </p>
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
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/" className="flex-1">
            <Button className="w-full" data-testid="button-home">
              <ArrowRight className="mr-2 h-4 w-4" />
              Kembali ke Home
            </Button>
          </Link>
          <Link href="/layanan" className="flex-1">
            <Button variant="outline" className="w-full" data-testid="button-browse-services">
              Lihat Layanan Lainnya
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
