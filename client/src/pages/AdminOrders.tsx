import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { subscribeToAllOrders, updateOrder, deleteOrder } from "@/lib/orders";
import { sendPushNotification } from "@/lib/messaging";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  User,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Order, OrderStatus } from "@shared/schema";

// Define SortOption type
type SortOption = "date-asc" | "date-desc" | "price-asc" | "price-desc";

export default function AdminOrders() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editFormData, setEditFormData] = useState({
    status: "" as OrderStatus,
    notes: "",
    deliveryDate: "",
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("🔄 Setting up real-time admin orders subscription");
    setIsLoading(true);

    const unsubscribe = subscribeToAllOrders(
      (orders) => {
        console.log("✅ Admin orders updated in real-time:", orders.length);
        setOrders(orders);
        setIsLoading(false);
      },
      (error) => {
        console.error("❌ Error in real-time subscription:", error);
        setIsLoading(false);
      }
    );

    return () => {
      console.log("🔌 Cleaning up admin orders subscription");
      unsubscribe();
    };
  }, []);

  const updateMutation = useMutation({
    mutationFn: ({ id, data, order }: { id: string; data: any; order?: Order }) =>
      updateOrder(id, data).then(() => ({ data, order })),
    onSuccess: async ({ data, order }) => {
      // Send push notification if payment status changed
      if (data.paymentStatus && order) {
        try {
          if (data.paymentStatus === "confirmed") {
            console.log("📤 Sending payment confirmation notification to user:", order.userId);
            await sendPushNotification({
              title: "✅ Pembayaran Dikonfirmasi",
              body: `Pembayaran untuk pesanan ${order.serviceName} telah dikonfirmasi. Pesanan Anda sedang diproses.`,
              targetType: "user",
              userId: order.userId,
              actionUrl: `/pesanan/${order.id}`
            });
            console.log("✅ Notification sent successfully");
          } else if (data.paymentStatus === "rejected") {
            console.log("📤 Sending payment rejection notification to user:", order.userId);
            await sendPushNotification({
              title: "❌ Pembayaran Ditolak",
              body: `Pembayaran untuk pesanan ${order.serviceName} ditolak. Silakan hubungi admin untuk informasi lebih lanjut.`,
              targetType: "user",
              userId: order.userId,
              actionUrl: `/pesanan/${order.id}`
            });
            console.log("✅ Notification sent successfully");
          }
        } catch (error) {
          console.error("❌ Failed to send notification:", error);
          // Don't show error to admin, just log it
        }
      }

      // No need to invalidate queries - real-time listener will update automatically
      toast({
        title: "Pesanan diperbarui",
        description: data.paymentStatus === "confirmed"
          ? "Pembayaran dikonfirmasi dan notifikasi dikirim ke user"
          : data.paymentStatus === "rejected"
          ? "Pembayaran ditolak dan notifikasi dikirim ke user"
          : "Status pesanan berhasil diperbarui",
      });
      setIsEditDialogOpen(false);
      setIsViewDialogOpen(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui pesanan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({
        title: "Pesanan dihapus",
        description: "Pesanan berhasil dihapus",
      });
      setIsDeleteDialogOpen(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menghapus pesanan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

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

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Sorting logic
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === "date-asc") {
      return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
    } else if (sortBy === "date-desc") {
      return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
    } else if (sortBy === "price-asc") {
      return a.finalPrice - b.finalPrice;
    } else if (sortBy === "price-desc") {
      return b.finalPrice - a.finalPrice;
    }
    return 0; // Default: no sorting
  });


  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter(o => o.status === "pending").length || 0,
    processing: orders?.filter(o => o.status === "processing").length || 0,
    completed: orders?.filter(o => o.status === "completed").length || 0,
    cancelled: orders?.filter(o => o.status === "cancelled").length || 0,
    totalRevenue: orders?.reduce((sum, o) =>
      o.status === "completed" ? sum + o.finalPrice : sum, 0) || 0,
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditFormData({
      status: order.status,
      notes: order.notes || "",
      deliveryDate: order.deliveryDate
        ? new Date(order.deliveryDate).toISOString().split('T')[0]
        : "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitEdit = () => {
    if (!selectedOrder) return;

    const updates: any = {
      status: editFormData.status,
    };

    if (editFormData.notes.trim()) {
      updates.notes = editFormData.notes.trim();
    }

    if (editFormData.deliveryDate) {
      updates.deliveryDate = editFormData.deliveryDate;
    }

    updateMutation.mutate({ id: selectedOrder.id, data: updates, order: selectedOrder });
  };

  const handleQuickStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    updateMutation.mutate({
      id: orderId,
      data: { status: newStatus },
      // Pass the order to the mutation for notification logic
      order: orders.find(o => o.id === orderId)
    });
  };

  const handleRejectPayment = (order: Order) => {
    setSelectedOrder(order);
    setRejectionReason(""); // Clear previous reason
    setShowRejectionDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Kelola Pesanan</h2>
        <p className="text-muted-foreground">
          Kelola dan pantau semua pesanan yang masuk
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Total Pesanan</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Menunggu</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Dikerjakan</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Selesai</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Dibatalkan</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              Rp {(stats.totalRevenue / 1000).toFixed(0)}k
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari pesanan, ID, atau user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as OrderStatus | "all")}
              >
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Menunggu Konfirmasi</SelectItem>
                  <SelectItem value="processing">Sedang Dikerjakan</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Sorting Select */}
            <div className="w-full md:w-48">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Urutkan Berdasarkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Tanggal Terbaru</SelectItem>
                  <SelectItem value="date-asc">Tanggal Terlama</SelectItem>
                  <SelectItem value="price-desc">Harga Tertinggi</SelectItem>
                  <SelectItem value="price-asc">Harga Terendah</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table - Desktop */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Pesanan</TableHead>
                  <TableHead>Layanan</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : sortedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">Tidak ada pesanan ditemukan</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        {order.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="font-medium">{order.serviceName}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {order.userId.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {new Date(order.orderDate).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="font-semibold">
                        Rp {order.finalPrice.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Status
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                            {order.status === "pending" && (
                              <DropdownMenuItem
                                onClick={() => handleQuickStatusUpdate(order.id, "processing")}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                                Konfirmasi & Kerjakan
                              </DropdownMenuItem>
                            )}
                            {order.status === "processing" && (
                              <DropdownMenuItem
                                onClick={() => handleQuickStatusUpdate(order.id, "completed")}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                Tandai Selesai
                              </DropdownMenuItem>
                            )}
                            {(order.status === "pending" || order.status === "processing") && (
                              <DropdownMenuItem
                                onClick={() => handleQuickStatusUpdate(order.id, "cancelled")}
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Batalkan Pesanan
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Payment Actions</DropdownMenuLabel>
                            {order.paymentStatus === "waiting_confirmation" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleViewOrder(order)} // Opens dialog to confirm/reject
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                                  Konfirmasi Pembayaran
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRejectPayment(order)}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Tolak Pembayaran
                                </DropdownMenuItem>
                              </>
                            )}
                            {order.paymentStatus === "confirmed" && (
                              <DropdownMenuItem disabled className="text-green-600">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Pembayaran Dikonfirmasi
                              </DropdownMenuItem>
                            )}
                            {order.paymentStatus === "rejected" && (
                              <DropdownMenuItem disabled className="text-red-600">
                                <XCircle className="h-4 w-4 mr-2" />
                                Pembayaran Ditolak
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteOrder(order)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus Pesanan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Orders List - Mobile */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))
        ) : sortedOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Tidak ada pesanan ditemukan</p>
            </CardContent>
          </Card>
        ) : (
          sortedOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{order.serviceName}</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      ID: {order.id.substring(0, 12)}...
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(order.orderDate).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <span className="font-semibold text-primary">
                    Rp {order.finalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewOrder(order)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    Detail
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditOrder(order)}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {order.status === "pending" && (
                        <DropdownMenuItem
                          onClick={() => handleQuickStatusUpdate(order.id, "processing")}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                          Konfirmasi
                        </DropdownMenuItem>
                      )}
                      {order.status === "processing" && (
                        <DropdownMenuItem
                          onClick={() => handleQuickStatusUpdate(order.id, "completed")}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                          Selesai
                        </DropdownMenuItem>
                      )}
                      {(order.status === "pending" || order.status === "processing") && (
                        <DropdownMenuItem
                          onClick={() => handleQuickStatusUpdate(order.id, "cancelled")}
                          className="text-red-600"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Batalkan
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Payment Actions</DropdownMenuLabel>
                      {order.paymentStatus === "waiting_confirmation" && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleViewOrder(order)} // Opens dialog to confirm/reject
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                            Konfirmasi Pembayaran
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRejectPayment(order)}
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Tolak Pembayaran
                          </DropdownMenuItem>
                        </>
                      )}
                      {order.paymentStatus === "confirmed" && (
                        <DropdownMenuItem disabled className="text-green-600">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Pembayaran Dikonfirmasi
                        </DropdownMenuItem>
                      )}
                      {order.paymentStatus === "rejected" && (
                        <DropdownMenuItem disabled className="text-red-600">
                          <XCircle className="h-4 w-4 mr-2" />
                          Pembayaran Ditolak
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteOrder(order)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pesanan</DialogTitle>
            <DialogDescription>
              Informasi lengkap tentang pesanan ini
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">ID Pesanan</Label>
                  <p className="font-mono text-sm">{selectedOrder.id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Layanan</Label>
                <p className="font-semibold">{selectedOrder.serviceName}</p>
              </div>

              {/* Payment Proof Display and Confirmation Buttons */}
              {selectedOrder.paymentProofUrl && (
                <div>
                  <Label className="text-xs text-muted-foreground">Bukti Pembayaran</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <img
                      src={selectedOrder.paymentProofUrl}
                      alt="Payment Proof"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    {selectedOrder.paymentStatus === "waiting_confirmation" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            updateMutation.mutate({
                              id: selectedOrder.id,
                              data: {
                                paymentStatus: "confirmed",
                                status: "processing",
                                uploadAttempts: 0 // Reset attempts on confirmation
                              },
                              order: selectedOrder
                            });
                          }}
                          className="flex-1"
                          disabled={updateMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Konfirmasi Pembayaran
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectPayment(selectedOrder)}
                          className="flex-1"
                          disabled={updateMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Tolak
                        </Button>
                      </>
                    )}
                    {selectedOrder.paymentStatus === "confirmed" && (
                      <Badge variant="default" className="w-full justify-center">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Pembayaran Dikonfirmasi
                      </Badge>
                    )}
                    {selectedOrder.paymentStatus === "rejected" && (
                      <Badge variant="destructive" className="w-full justify-center">
                        <XCircle className="h-4 w-4 mr-2" />
                        Pembayaran Ditolak
                      </Badge>
                    )}
                  </div>
                  {selectedOrder.rejectionReason && selectedOrder.paymentStatus === "rejected" && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                      <Label className="text-xs text-red-700 dark:text-red-300">Alasan Penolakan</Label>
                      <p className="text-sm text-red-700 dark:text-red-300 font-medium mt-1">{selectedOrder.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">User ID</Label>
                <p className="font-mono text-sm">{selectedOrder.userId}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Harga Original</Label>
                  <p className="font-semibold">
                    Rp {selectedOrder.originalPrice.toLocaleString('id-ID')}
                  </p>
                </div>
                {selectedOrder.voucherCode && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Voucher</Label>
                    <p className="font-semibold">{selectedOrder.voucherCode}</p>
                  </div>
                )}
              </div>

              {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Diskon</Label>
                  <p className="font-semibold text-green-600">
                    - Rp {selectedOrder.discountAmount.toLocaleString('id-ID')}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Harga Final</Label>
                <p className="text-xl font-bold text-primary">
                  Rp {selectedOrder.finalPrice.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Tanggal Pesanan</Label>
                  <p className="text-sm">
                    {new Date(selectedOrder.orderDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                {selectedOrder.deliveryDate && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Tanggal Pengiriman</Label>
                    <p className="text-sm">
                      {new Date(selectedOrder.deliveryDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>

              {selectedOrder.notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Catatan</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pesanan</DialogTitle>
            <DialogDescription>
              Ubah status dan informasi pesanan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, status: value as OrderStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Menunggu Konfirmasi</SelectItem>
                  <SelectItem value="processing">Sedang Dikerjakan</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tanggal Pengiriman (Opsional)</Label>
              <Input
                type="date"
                value={editFormData.deliveryDate}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, deliveryDate: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Catatan Admin (Opsional)</Label>
              <Textarea
                placeholder="Tambahkan catatan untuk pesanan ini..."
                value={editFormData.notes}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={updateMutation.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pesanan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pesanan ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="p-4 bg-muted rounded-md space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="font-semibold">{selectedOrder.serviceName}</span>
              </div>
              <p className="text-sm text-muted-foreground font-mono">
                ID: {selectedOrder.id}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedOrder && deleteMutation.mutate(selectedOrder.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus Pesanan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pembayaran</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan untuk membantu customer memahami masalahnya
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejection-reason">Alasan Penolakan</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Contoh: Nominal transfer tidak sesuai dengan total pembayaran"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                💡 <strong>Tips:</strong> Jelaskan secara spesifik apa yang salah agar customer bisa memperbaikinya dengan benar.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectionDialog(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedOrder) {
                  updateMutation.mutate({
                    id: selectedOrder.id,
                    data: {
                      paymentStatus: "rejected",
                      rejectionReason: rejectionReason || "Bukti pembayaran tidak valid"
                    },
                    order: selectedOrder
                  });
                  setShowRejectionDialog(false);
                }
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Memproses..." : "Tolak Pembayaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}