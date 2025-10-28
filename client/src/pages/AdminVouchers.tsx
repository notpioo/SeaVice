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
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVoucherSchema, type Voucher, type InsertVoucher } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  getAllVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
} from "@/lib/vouchers";
import { Plus, Edit, Trash2, Ticket, Loader2, Percent, DollarSign, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function AdminVouchers() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

  const { data: vouchers, isLoading } = useQuery<Voucher[]>({
    queryKey: ["vouchers"],
    queryFn: getAllVouchers,
  });

  const form = useForm<InsertVoucher>({
    resolver: zodResolver(insertVoucherSchema),
    defaultValues: {
      code: "",
      discountType: "percentage",
      discountValue: 0,
      isActive: true,
      minPurchase: 0,
      maxDiscount: undefined,
      usageLimit: 100,
      expiryDate: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: createVoucher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast({
        title: "Voucher ditambahkan",
        description: "Voucher berhasil ditambahkan",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menambahkan voucher",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertVoucher> }) =>
      updateVoucher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast({
        title: "Voucher diperbarui",
        description: "Voucher berhasil diperbarui",
      });
      setIsDialogOpen(false);
      setEditingVoucher(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui voucher",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVoucher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast({
        title: "Voucher dihapus",
        description: "Voucher berhasil dihapus",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menghapus voucher",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (voucher?: Voucher) => {
    if (voucher) {
      setEditingVoucher(voucher);
      form.reset({
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        isActive: voucher.isActive,
        minPurchase: voucher.minPurchase,
        maxDiscount: voucher.maxDiscount,
        usageLimit: voucher.usageLimit,
        expiryDate: format(voucher.expiryDate, "yyyy-MM-dd"),
        description: voucher.description || "",
      });
    } else {
      setEditingVoucher(null);
      form.reset({
        code: "",
        discountType: "percentage",
        discountValue: 0,
        isActive: true,
        minPurchase: 0,
        maxDiscount: undefined,
        usageLimit: 100,
        expiryDate: "",
        description: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: InsertVoucher) => {
    if (editingVoucher) {
      updateMutation.mutate({ id: editingVoucher.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus voucher ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const discountType = form.watch("discountType");
  const isExpired = (date: Date) => new Date() > date;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 break-words" data-testid="text-title">
              Kelola Voucher
            </h1>
            <p className="text-sm md:text-base text-muted-foreground break-words" data-testid="text-subtitle">
              Kelola voucher diskon untuk layanan Anda
            </p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            size="default"
            className="flex-shrink-0 w-full md:w-auto"
            data-testid="button-add-voucher"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Voucher
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64" data-testid={`skeleton-voucher-${i}`} />
            ))}
          </div>
        ) : vouchers && vouchers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {vouchers.map((voucher) => (
              <Card 
                key={voucher.id} 
                className="relative overflow-hidden"
                data-testid={`card-voucher-${voucher.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${voucher.isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Ticket className={`h-5 w-5 ${voucher.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base md:text-lg font-bold truncate" data-testid={`text-code-${voucher.id}`}>
                          {voucher.code}
                        </CardTitle>
                        <div className="flex gap-2 mt-1">
                          <Badge 
                            variant={voucher.isActive ? "default" : "secondary"}
                            data-testid={`badge-status-${voucher.id}`}
                          >
                            {voucher.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                          {isExpired(voucher.expiryDate) && (
                            <Badge variant="destructive" data-testid={`badge-expired-${voucher.id}`}>
                              Kadaluarsa
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    {voucher.discountType === "percentage" ? (
                      <Percent className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-semibold" data-testid={`text-discount-${voucher.id}`}>
                      {voucher.discountType === "percentage"
                        ? `Diskon ${voucher.discountValue}%`
                        : `Diskon Rp ${voucher.discountValue.toLocaleString("id-ID")}`}
                    </span>
                  </div>

                  {voucher.description && (
                    <p className="text-sm text-muted-foreground" data-testid={`text-description-${voucher.id}`}>
                      {voucher.description}
                    </p>
                  )}

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Min. Pembelian:</span>
                      <span className="font-medium" data-testid={`text-min-purchase-${voucher.id}`}>
                        Rp {voucher.minPurchase.toLocaleString("id-ID")}
                      </span>
                    </div>
                    {voucher.maxDiscount && (
                      <div className="flex justify-between">
                        <span>Maks. Diskon:</span>
                        <span className="font-medium" data-testid={`text-max-discount-${voucher.id}`}>
                          Rp {voucher.maxDiscount.toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Penggunaan:</span>
                      <span className="font-medium" data-testid={`text-usage-${voucher.id}`}>
                        {voucher.usedCount} / {voucher.usageLimit}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground" data-testid={`text-expiry-${voucher.id}`}>
                      Berlaku s/d {format(voucher.expiryDate, "dd MMM yyyy", { locale: id })}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-0"
                      onClick={() => handleOpenDialog(voucher)}
                      data-testid={`button-edit-${voucher.id}`}
                    >
                      <Edit className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate text-xs md:text-sm">Edit</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 min-w-0"
                      onClick={() => handleDelete(voucher.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${voucher.id}`}
                    >
                      <Trash2 className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate text-xs md:text-sm">Hapus</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Ticket className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2" data-testid="text-empty-title">
                Belum Ada Voucher
              </h3>
              <p className="text-muted-foreground mb-6" data-testid="text-empty-description">
                Tambahkan voucher pertama Anda untuk mulai memberikan diskon
              </p>
              <Button onClick={() => handleOpenDialog()} data-testid="button-add-first-voucher">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Voucher
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-voucher">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">
                {editingVoucher ? "Edit Voucher" : "Tambah Voucher Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingVoucher
                  ? "Perbarui detail voucher"
                  : "Buat voucher diskon baru untuk layanan Anda"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kode Voucher</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="DISKON10"
                          className="uppercase"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          data-testid="input-code"
                        />
                      </FormControl>
                      <FormDescription>
                        Hanya huruf kapital dan angka (contoh: DISKON10, NEWUSER50)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="discountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipe Diskon</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-discount-type">
                              <SelectValue placeholder="Pilih tipe diskon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage" data-testid="option-percentage">
                              Persentase (%)
                            </SelectItem>
                            <SelectItem value="fixed" data-testid="option-fixed">
                              Nominal (Rp)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discountValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nilai Diskon</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder={discountType === "percentage" ? "10" : "5000"}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-discount-value"
                          />
                        </FormControl>
                        <FormDescription>
                          {discountType === "percentage" ? "Dalam persen (%)" : "Dalam rupiah (Rp)"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minPurchase"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimal Pembelian</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="0"
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-min-purchase"
                          />
                        </FormControl>
                        <FormDescription>Dalam rupiah (Rp)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {discountType === "percentage" && (
                    <FormField
                      control={form.control}
                      name="maxDiscount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maksimal Diskon</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="100000"
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseFloat(e.target.value) : undefined
                                )
                              }
                              data-testid="input-max-discount"
                            />
                          </FormControl>
                          <FormDescription>Dalam rupiah (Rp), opsional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="usageLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batas Penggunaan</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="100"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-usage-limit"
                          />
                        </FormControl>
                        <FormDescription>Jumlah maksimal penggunaan</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Kadaluarsa</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            data-testid="input-expiry-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi (Opsional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Deskripsi voucher..."
                          rows={2}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormDescription>Deskripsi singkat tentang voucher</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Status Voucher</FormLabel>
                        <FormDescription>
                          Aktifkan atau nonaktifkan voucher ini
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-cancel"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : editingVoucher ? (
                      "Perbarui"
                    ) : (
                      "Tambah"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
