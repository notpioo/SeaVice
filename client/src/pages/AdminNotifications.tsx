
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNotificationSchema, type Notification, type InsertNotification } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  getAllNotifications,
  createNotification,
  deleteNotification,
  sendPushNotification,
  requestNotificationPermission,
  saveFCMToken,
} from "@/lib/messaging";
import { auth } from "@/lib/firebase";
import { 
  Plus, 
  Trash2, 
  Bell, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Image as ImageIcon,
  Users,
  User,
  TrendingUp,
  MousePointer,
  Calendar,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminNotifications() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: getAllNotifications,
  });

  const form = useForm<InsertNotification>({
    resolver: zodResolver(insertNotificationSchema),
    defaultValues: {
      title: "",
      body: "",
      imageUrl: "",
      actionUrl: "",
      targetType: "all",
      userId: "",
      status: "draft",
      scheduledAt: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertNotification) => {
      const notification = await createNotification(data);
      
      // If sending immediately, trigger push notification
      if (!data.scheduledAt) {
        await sendPushNotification({
          title: data.title,
          body: data.body,
          targetType: data.targetType,
          userId: data.userId,
          imageUrl: data.imageUrl,
          actionUrl: data.actionUrl,
        });
      }
      
      return notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({
        title: "Notifikasi dibuat",
        description: "Notifikasi berhasil dibuat dan dikirim",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal membuat notifikasi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({
        title: "Notifikasi dihapus",
        description: "Notifikasi berhasil dihapus",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menghapus notifikasi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRequestPermission = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      setIsPermissionGranted(true);
      
      // Save token to Firestore
      const userId = auth.currentUser?.uid;
      if (userId) {
        try {
          await saveFCMToken(userId, token);
          console.log('FCM Token saved:', token);
        } catch (error) {
          console.error('Failed to save FCM token:', error);
        }
      }
      
      toast({
        title: "Permission granted",
        description: "Notifikasi push telah diaktifkan",
      });
    }
  };

  const handleSubmit = (data: InsertNotification) => {
    createMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus notifikasi ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      draft: "secondary",
      scheduled: "default",
      sent: "default",
      failed: "destructive",
    };

    const labels: Record<string, string> = {
      draft: "Draft",
      scheduled: "Terjadwal",
      sent: "Terkirim",
      failed: "Gagal",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const stats = {
    total: notifications?.length || 0,
    sent: notifications?.filter(n => n.status === "sent").length || 0,
    scheduled: notifications?.filter(n => n.status === "scheduled").length || 0,
    totalDelivered: notifications?.reduce((sum, n) => sum + n.deliveredCount, 0) || 0,
    totalClicked: notifications?.reduce((sum, n) => sum + n.clickedCount, 0) || 0,
  };

  const targetType = form.watch("targetType");

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl md:text-2xl font-bold mb-2 break-words">Push Notifications</h2>
          <p className="text-sm md:text-base text-muted-foreground break-words">
            Kelola dan kirim notifikasi push ke pengguna
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
          {!isPermissionGranted && (
            <Button variant="outline" onClick={handleRequestPermission} className="w-full sm:w-auto">
              <Bell className="h-4 w-4 mr-2" />
              <span className="text-xs md:text-sm">Enable Notifications</span>
            </Button>
          )}
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-notification" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="text-xs md:text-sm">Buat Notifikasi</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Terkirim</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Terjadwal</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Delivered</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDelivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Clicked</CardTitle>
            <MousePointer className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicked}</div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : notifications && notifications.length > 0 ? (
                notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="min-w-[200px] max-w-[300px]">
                      <div className="min-w-0">
                        <p className="font-medium truncate text-sm md:text-base">{notification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 break-words">
                          {notification.body}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {notification.targetType === "all" ? (
                          <Users className="h-3.5 w-3.5 flex-shrink-0" />
                        ) : (
                          <User className="h-3.5 w-3.5 flex-shrink-0" />
                        )}
                        <span className="text-xs md:text-sm">
                          {notification.targetType === "all" ? "Semua" : "User"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{getStatusBadge(notification.status)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-xs md:text-sm">
                        {notification.scheduledAt ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(notification.scheduledAt, "dd MMM yyyy", { locale: id })}
                          </div>
                        ) : notification.sentAt ? (
                          format(notification.sentAt, "dd MMM yyyy", { locale: id })
                        ) : (
                          "-"
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-xs text-muted-foreground">
                        {notification.deliveredCount} / {notification.clickedCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        disabled={deleteMutation.isPending}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Bell className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">Belum ada notifikasi</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Notification Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Notifikasi Push</DialogTitle>
            <DialogDescription>
              Kirim notifikasi push ke pengguna aplikasi
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Notifikasi</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Promo Spesial 50%!"
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Isi Notifikasi</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Dapatkan diskon hingga 50% untuk semua layanan..."
                        rows={3}
                        data-testid="input-body"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Penerima</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-target">
                          <SelectValue placeholder="Pilih target" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Semua Pengguna</SelectItem>
                        <SelectItem value="user">User Spesifik</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {targetType === "user" && (
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User ID</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="User ID"
                          data-testid="input-user-id"
                        />
                      </FormControl>
                      <FormDescription>
                        Masukkan User ID yang akan menerima notifikasi
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Gambar (Opsional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://example.com/image.jpg"
                        data-testid="input-image"
                      />
                    </FormControl>
                    <FormDescription>
                      Gambar akan ditampilkan di notifikasi
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="actionUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action URL (Opsional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="/layanan"
                        data-testid="input-action"
                      />
                    </FormControl>
                    <FormDescription>
                      URL tujuan saat notifikasi diklik
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jadwal Pengiriman (Opsional)</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                        data-testid="input-schedule"
                      />
                    </FormControl>
                    <FormDescription>
                      Kosongkan untuk kirim sekarang
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={createMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending ? (
                    <>
                      <Send className="mr-2 h-4 w-4 animate-pulse" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Kirim Notifikasi
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
