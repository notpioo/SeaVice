import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { getUserOrders } from "@/lib/orders";
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

  const { data: allOrders, isLoading } = useQuery<Order[]>({
    queryKey: ["orders", user?.id],
    queryFn: () => (user ? getUserOrders(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  const getStatusIcon = (status: OrderStatus) => {
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

  const getStatusBadge = (status: OrderStatus) => {
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
      <Badge variant={variants[status]} className="gap-1.5">
        {getStatusIcon(status)}
        {labels[status]}
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
    <div className="min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Riwayat Pesanan
          </h1>
          <p className="text-muted-foreground">
            Kelola dan lacak semua pesanan Anda
          </p>
        </div>

        {/* Status Filter Bar */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              data-testid="filter-all"
              className="whitespace-nowrap"
            >
              Semua ({statusCounts.all})
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("pending")}
              data-testid="filter-pending"
              className="whitespace-nowrap"
            >
              Pending ({statusCounts.pending})
            </Button>
            <Button
              variant={statusFilter === "processing" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("processing")}
              data-testid="filter-processing"
              className="whitespace-nowrap"
            >
              Proses ({statusCounts.processing})
            </Button>
            <Button
              variant={statusFilter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("completed")}
              data-testid="filter-completed"
              className="whitespace-nowrap"
            >
              Selesai ({statusCounts.completed})
            </Button>
            <Button
              variant={statusFilter === "cancelled" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("cancelled")}
              data-testid="filter-cancelled"
              className="whitespace-nowrap"
            >
              Batal ({statusCounts.cancelled})
            </Button>
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
                className="hover-elevate"
                data-testid={`order-card-${order.id}`}
              >
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="font-semibold text-lg" data-testid={`text-service-name-${order.id}`}>
                            {order.serviceName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            ID: <span className="font-mono" data-testid={`text-order-id-${order.id}`}>{order.id}</span>
                          </p>
                        </div>
                        <div data-testid={`badge-status-${order.id}`}>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span data-testid={`text-order-date-${order.id}`}>
                            {new Date(order.orderDate).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="font-semibold text-primary text-lg" data-testid={`text-price-${order.id}`}>
                          Rp {order.servicePrice.toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/pesanan/${order.id}`}>
                        <Button variant="outline" size="sm" data-testid={`button-view-detail-${order.id}`}>
                          Lihat Detail
                        </Button>
                      </Link>
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
