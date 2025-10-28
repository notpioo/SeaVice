import { useState, useEffect } from "react";
import { Link } from "wouter";
import { subscribeToUserOrders } from "@/lib/orders";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Package,
  CheckCircle2,
  XCircle,
  Calendar,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import type { Order, OrderStatus } from "@shared/schema";

type SortOption = "date-desc" | "date-asc" | "price-desc" | "price-asc";

export default function Orders() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    console.log("🔄 Setting up real-time orders subscription");
    setIsLoading(true);

    const unsubscribe = subscribeToUserOrders(
      user.id,
      (orders) => {
        console.log("✅ Orders updated in real-time:", orders.length);
        setAllOrders(orders);
        setIsLoading(false);
      },
      (error) => {
        console.error("❌ Error in real-time subscription:", error);
        setIsLoading(false);
      }
    );

    return () => {
      console.log("🔌 Cleaning up orders subscription");
      unsubscribe();
    };
  }, [user?.id]);

  const getStatusIcon = (status: OrderStatus, paymentStatus?: string) => {
    if (status === "pending" && paymentStatus === "waiting_payment") {
      return <Clock className="h-4 w-4" />;
    }
    if (status === "pending" && paymentStatus === "waiting_confirmation") {
      return <Clock className="h-4 w-4" />;
    }
    
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "processing":
        return <Package className="h-4 w-4" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (order: Order) => {
    // If order is pending and waiting for payment
    if (order.status === "pending" && order.paymentStatus === "waiting_payment") {
      return (
        <Badge variant="secondary" className="gap-1.5 inline-flex bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span className="text-xs">Menunggu Pembayaran</span>
        </Badge>
      );
    }
    
    // If order is pending and waiting for confirmation
    if (order.status === "pending" && order.paymentStatus === "waiting_confirmation") {
      return (
        <Badge variant="secondary" className="gap-1.5 inline-flex bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span className="text-xs">Menunggu Konfirmasi Admin</span>
        </Badge>
      );
    }

    // If payment is confirmed but order is still pending
    if (order.status === "pending" && order.paymentStatus === "confirmed") {
      return (
        <Badge variant="secondary" className="gap-1.5 inline-flex">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span className="text-xs">Menunggu Diproses</span>
        </Badge>
      );
    }

    // If payment is rejected
    if (order.paymentStatus === "rejected") {
      return (
        <Badge variant="destructive" className="gap-1.5 inline-flex">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-xs">Pembayaran Ditolak</span>
        </Badge>
      );
    }
    
    const variants: Record<OrderStatus, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      processing: "default",
      completed: "default",
      cancelled: "destructive",
    };

    const labels: Record<OrderStatus, string> = {
      pending: "Menunggu Konfirmasi",
      processing: "Sedang Dikerjakan",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    };

    return (
      <Badge variant={variants[order.status]} className="gap-1.5 inline-flex">
        {getStatusIcon(order.status, order.paymentStatus)}
        <span className="text-xs">{labels[order.status]}</span>
      </Badge>
    );
  };

  const getStatusCounts = (orders: Order[]) => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      processing: orders.filter((o) => o.status === "processing").length,
      completed: orders.filter((o) => o.status === "completed").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
  };

  const sortOrders = (orders: Order[], sortOption: SortOption): Order[] => {
    const sorted = [...orders];
    switch (sortOption) {
      case "date-desc":
        return sorted.sort(
          (a, b) =>
            new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        );
      case "date-asc":
        return sorted.sort(
          (a, b) =>
            new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
        );
      case "price-desc":
        return sorted.sort((a, b) => b.servicePrice - a.servicePrice);
      case "price-asc":
        return sorted.sort((a, b) => a.servicePrice - b.servicePrice);
      default:
        return sorted;
    }
  };

  const filteredAndSortedOrders = allOrders
    ? sortOrders(
        statusFilter === "all"
          ? allOrders
          : allOrders.filter((o) => o.status === statusFilter),
        sortBy
      )
    : [];

  const statusCounts = allOrders ? getStatusCounts(allOrders) : { all: 0, pending: 0, processing: 0, completed: 0, cancelled: 0 };

  if (isLoading) {
    return (
      <div className="min-h-screen py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 md:py-12 overflow-x-hidden w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-8 overflow-x-hidden w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Riwayat Pesanan
          </h1>
          <p className="text-muted-foreground">
            Kelola dan lacak semua pesanan Anda
          </p>
        </div>

        {/* Status Filter Bar */}
        <div className="mb-6">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                data-testid="filter-all"
                className="whitespace-nowrap flex-shrink-0"
              >
                Semua ({statusCounts.all})
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
                data-testid="filter-pending"
                className="whitespace-nowrap flex-shrink-0"
              >
                Pending ({statusCounts.pending})
              </Button>
              <Button
                variant={statusFilter === "processing" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("processing")}
                data-testid="filter-processing"
                className="whitespace-nowrap flex-shrink-0"
              >
                Proses ({statusCounts.processing})
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("completed")}
                data-testid="filter-completed"
                className="whitespace-nowrap flex-shrink-0"
              >
                Selesai ({statusCounts.completed})
              </Button>
              <Button
                variant={statusFilter === "cancelled" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("cancelled")}
                data-testid="filter-cancelled"
                className="whitespace-nowrap flex-shrink-0"
              >
                Batal ({statusCounts.cancelled})
              </Button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-sort">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Terbaru</SelectItem>
              <SelectItem value="date-asc">Terlama</SelectItem>
              <SelectItem value="price-desc">Harga Tertinggi</SelectItem>
              <SelectItem value="price-asc">Harga Terendah</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        {filteredAndSortedOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tidak Ada Pesanan</h3>
              <p className="text-muted-foreground text-center mb-6">
                {statusFilter === "all"
                  ? "Anda belum memiliki pesanan apapun"
                  : `Tidak ada pesanan dengan status ${statusFilter}`}
              </p>
              <Link href="/layanan">
                <Button data-testid="button-browse-services">
                  Lihat Layanan
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAndSortedOrders.map((order) => (
              <Card
                key={order.id}
                className="hover-elevate overflow-hidden"
                data-testid={`order-card-${order.id}`}
              >
                <CardHeader className="p-4 overflow-hidden">
                  <div className="space-y-3">
                    {/* Title and Status Badge */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-lg flex-1 min-w-0" data-testid={`text-service-name-${order.id}`}>
                          {order.serviceName}
                        </h3>
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-muted-foreground break-all">
                          ID: <span className="font-mono" data-testid={`text-order-id-${order.id}`}>{order.id.substring(0, 16)}...</span>
                        </p>
                        <div data-testid={`badge-status-${order.id}`}>
                          {getStatusBadge(order)}
                        </div>
                      </div>
                    </div>

                    {/* Date and Price */}
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span data-testid={`text-order-date-${order.id}`} className="text-xs">
                          {new Date(order.orderDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="font-semibold text-primary text-lg" data-testid={`text-price-${order.id}`}>
                        Rp {order.finalPrice.toLocaleString("id-ID")}
                      </div>
                    </div>

                    {/* Warning Messages */}
                    {order.paymentStatus === "waiting_payment" && (
                      <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-md border border-amber-200 dark:border-amber-800">
                        ⚠️ Segera lakukan pembayaran untuk melanjutkan pesanan
                      </div>
                    )}
                    {order.paymentStatus === "waiting_confirmation" && (
                      <div className="text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-3 py-2 rounded-md border border-blue-200 dark:border-blue-800">
                        ⏳ Bukti pembayaran sedang diverifikasi oleh admin
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {order.paymentStatus === "rejected" && order.rejectionReason && (
                      <div className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-md border border-red-200 dark:border-red-800">
                        <strong>Alasan Penolakan:</strong> {order.rejectionReason}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {order.paymentStatus === "waiting_payment" ? (
                        <Link href={`/payment/${order.id}`} className="flex-1">
                          <Button size="sm" className="w-full" data-testid={`button-payment-${order.id}`}>
                            Bayar Sekarang
                          </Button>
                        </Link>
                      ) : order.paymentStatus === "rejected" ? (
                        <Link href={`/payment/${order.id}`} className="flex-1">
                          <Button size="sm" variant="destructive" className="w-full" data-testid={`button-reupload-${order.id}`}>
                            Upload Bukti Baru
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/pesanan/${order.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-detail-${order.id}`}>
                            Lihat Detail
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {order.notes && (
                  <CardContent>
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-1">Catatan:</p>
                      <p className="text-sm text-muted-foreground" data-testid={`text-notes-${order.id}`}>
                        {order.notes}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
