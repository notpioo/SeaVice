import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServiceSchema, type Service, type InsertService } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { getAllServices, createService, updateService, deleteService } from "@/lib/services";
import { Plus, Edit, Trash2, Package, Loader2, Ticket, Bell, Signal, Wifi } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import AdminVouchers from "./AdminVouchers";
import AdminOrders from "./AdminOrders";
import AdminNotifications from "./AdminNotifications";
import AdminAnnouncements from "./AdminAnnouncements";
import AdminKuotaProducts from "./AdminKuotaProducts";

export default function Admin() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [featureInput, setFeatureInput] = useState("");

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: getAllServices,
  });

  const form = useForm<InsertService>({
    resolver: zodResolver(insertServiceSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      price: 0,
      imageUrl: undefined,
      features: [],
      deliveryTime: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: createService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      await queryClient.refetchQueries({ queryKey: ["services"] });
      toast({
        title: "Layanan ditambahkan",
        description: "Layanan berhasil ditambahkan",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menambahkan layanan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertService }) =>
      updateService(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      await queryClient.refetchQueries({ queryKey: ["services"] });
      toast({
        title: "Layanan diperbarui",
        description: "Layanan berhasil diperbarui",
      });
      setIsDialogOpen(false);
      setEditingService(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui layanan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({
        title: "Layanan dihapus",
        description: "Layanan berhasil dihapus",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menghapus layanan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      form.reset({
        title: service.title,
        description: service.description,
        category: service.category,
        price: service.price,
        imageUrl: service.imageUrl || undefined,
        features: service.features,
        deliveryTime: service.deliveryTime,
      });
    } else {
      setEditingService(null);
      form.reset({
        title: "",
        description: "",
        category: "",
        price: 0,
        imageUrl: undefined,
        features: [],
        deliveryTime: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
    form.reset();
    setFeatureInput("");
  };

  const onSubmit = (data: InsertService) => {
    console.log('📝 Submitting service data:', JSON.stringify(data, null, 2));
    console.log('📝 imageUrl in data:', data.imageUrl);
    console.log('📝 Form values:', JSON.stringify(form.getValues(), null, 2));
    console.log('📝 Form imageUrl:', form.getValues('imageUrl'));
    
    if (editingService) {
      console.log('✏️ Updating service ID:', editingService.id);
      const updateData = {
        ...data,
        orderCount: editingService.orderCount || 0,
        rating: editingService.rating || 5.0,
      };
      console.log('✏️ Final update payload:', JSON.stringify(updateData, null, 2));
      updateMutation.mutate({
        id: editingService.id,
        data: updateData,
      });
    } else {
      console.log('➕ Creating new service');
      const createData = {
        ...data,
        orderCount: 0,
        rating: 5.0,
      };
      console.log('➕ Final create payload:', JSON.stringify(createData, null, 2));
      createMutation.mutate(createData);
    }
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      const currentFeatures = form.getValues("features") || [];
      form.setValue("features", [...currentFeatures, featureInput.trim()]);
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    const currentFeatures = form.getValues("features") || [];
    form.setValue(
      "features",
      currentFeatures.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="min-h-screen py-8 md:py-12 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 break-words">Admin Panel</h1>
          <p className="text-sm md:text-base text-muted-foreground">Kelola layanan dan voucher SeaVice</p>
        </div>

        <Tabs defaultValue="services" className="w-full">
          <div className="mb-8 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-full md:w-full" data-testid="tabs-admin">
              <TabsTrigger value="services" data-testid="tab-services" className="flex-shrink-0 text-xs md:text-sm">
                <Package className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden xs:inline">Layanan</span>
              </TabsTrigger>
              <TabsTrigger value="orders" data-testid="tab-orders" className="flex-shrink-0 text-xs md:text-sm">
                <Package className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden xs:inline">Pesanan</span>
              </TabsTrigger>
              <TabsTrigger value="announcements" data-testid="tab-announcements" className="flex-shrink-0 text-xs md:text-sm">
                <Bell className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden xs:inline">Pengumuman</span>
              </TabsTrigger>
              <TabsTrigger value="vouchers" data-testid="tab-vouchers" className="flex-shrink-0 text-xs md:text-sm">
                <Ticket className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden xs:inline">Voucher</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" data-testid="tab-notifications" className="flex-shrink-0 text-xs md:text-sm">
                <Bell className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden xs:inline">Notifikasi</span>
              </TabsTrigger>
              <TabsTrigger value="pulsa" data-testid="tab-pulsa" className="flex-shrink-0 text-xs md:text-sm">
                <Signal className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden xs:inline">Pulsa</span>
              </TabsTrigger>
              <TabsTrigger value="kuota" data-testid="tab-kuota" className="flex-shrink-0 text-xs md:text-sm">
                <Wifi className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden xs:inline">Kuota</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="services">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold">Kelola Layanan</h2>
                <p className="text-muted-foreground">Tambah, edit, atau hapus layanan</p>
              </div>
              <Button onClick={() => handleOpenDialog()} data-testid="button-add-service">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Layanan
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Layanan</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{services?.length || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Services Table */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-20 w-20 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-1/3" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : services && services.length > 0 ? (
              <div className="space-y-4">
                {services.map((service) => (
                  <Card key={service.id} data-testid={`card-admin-service-${service.id}`} className="overflow-hidden">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start flex-wrap gap-2 mb-2">
                            <h3 className="font-semibold text-base md:text-lg break-words" data-testid={`text-admin-title-${service.id}`}>
                              {service.title}
                            </h3>
                            <Badge variant="secondary" className="flex-shrink-0">{service.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2 break-words">
                            {service.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm">
                            <span className="font-semibold text-primary whitespace-nowrap">
                              Rp {service.price.toLocaleString('id-ID')}
                            </span>
                            <span className="text-muted-foreground truncate">{service.deliveryTime}</span>
                            <span className="text-muted-foreground whitespace-nowrap">
                              {service.features.length} fitur
                            </span>
                            {/* Placeholder for real data */}
                            <span className="text-muted-foreground whitespace-nowrap">
                              Pesanan: {service.orderCount || 0}
                            </span>
                            <span className="text-muted-foreground whitespace-nowrap">
                              Rating: {service.rating !== undefined ? service.rating.toFixed(1) : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(service)}
                            data-testid={`button-edit-${service.id}`}
                            className="flex-1 md:flex-initial"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            <span className="text-xs md:text-sm">Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(service.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${service.id}`}
                            className="flex-1 md:flex-initial"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            <span className="text-xs md:text-sm">Hapus</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Belum Ada Layanan</h3>
                  <p className="text-muted-foreground mb-6">
                    Tambahkan layanan pertama Anda untuk memulai
                  </p>
                  <Button onClick={() => handleOpenDialog()} data-testid="button-add-first-service">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Layanan
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingService ? "Edit Layanan" : "Tambah Layanan Baru"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingService
                      ? "Perbarui informasi layanan"
                      : "Isi form di bawah untuk menambahkan layanan baru"}
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Judul Layanan</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: Jasa Pengerjaan Tugas" {...field} data-testid="input-service-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deskripsi</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Deskripsi lengkap tentang layanan..."
                              className="min-h-24"
                              {...field}
                              data-testid="input-service-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kategori</FormLabel>
                            <FormControl>
                              <Input placeholder="Contoh: Tugas" {...field} data-testid="input-service-category" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Harga (Rp)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="50000"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                data-testid="input-service-price"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="deliveryTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Waktu Pengerjaan</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: 2-3 hari" {...field} data-testid="input-service-delivery" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gambar Layanan (Opsional)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    console.log('📤 Uploading image to Cloudinary...');
                                    const formData = new FormData();
                                    formData.append('image', file);
                                    try {
                                      const response = await fetch('/api/upload-service-image', {
                                        method: 'POST',
                                        body: formData,
                                      });
                                      const data = await response.json();
                                      console.log('✅ Cloudinary response:', data);
                                      if (data.imageUrl) {
                                        field.onChange(data.imageUrl);
                                        console.log('✅ Image URL set to form:', data.imageUrl);
                                      }
                                    } catch (error) {
                                      console.error('❌ Upload error:', error);
                                    }
                                  }
                                }}
                                data-testid="input-service-image"
                              />
                              {field.value && (
                                <div className="mt-2">
                                  <img
                                    src={field.value}
                                    alt="Preview"
                                    className="w-32 h-32 object-cover rounded-lg border"
                                  />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="features"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fitur</FormLabel>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Tambahkan fitur..."
                                value={featureInput}
                                onChange={(e) => setFeatureInput(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddFeature();
                                  }
                                }}
                                data-testid="input-feature"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddFeature}
                                data-testid="button-add-feature"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {field.value?.map((feature, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="gap-1"
                                  data-testid={`badge-feature-${index}`}
                                >
                                  {feature}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFeature(index)}
                                    className="ml-1 hover:text-destructive"
                                    data-testid={`button-remove-feature-${index}`}
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseDialog}
                        data-testid="button-cancel-service"
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        data-testid="button-save-service"
                      >
                        {(createMutation.isPending || updateMutation.isPending) ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                          </>
                        ) : editingService ? (
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
          </TabsContent>

          <TabsContent value="orders">
            <AdminOrders />
          </TabsContent>

          <TabsContent value="announcements">
            <AdminAnnouncements />
          </TabsContent>

          <TabsContent value="vouchers">
            <AdminVouchers />
          </TabsContent>

          <TabsContent value="notifications">
            <AdminNotifications />
          </TabsContent>

          <TabsContent value="pulsa">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold">Kelola Produk Pulsa</h2>
                <p className="text-muted-foreground">Atur harga, visibilitas, dan markup produk pulsa</p>
              </div>
              <Link href="/admin/pulsa-products">
                <Button data-testid="button-manage-pulsa">
                  <Signal className="h-4 w-4 mr-2" />
                  Kelola Produk
                </Button>
              </Link>
            </div>

            <Card>
              <CardContent className="py-12 text-center">
                <Signal className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Pengaturan Produk Pulsa</h3>
                <p className="text-muted-foreground mb-4">
                  Klik tombol di atas untuk mengatur harga jual, visibilitas, dan markup produk pulsa
                </p>
                <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-2">
                  <li className="flex items-center gap-2">
                    <Badge variant="outline">1</Badge>
                    Atur markup global untuk semua produk pulsa
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline">2</Badge>
                    Kustomisasi harga per produk
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline">3</Badge>
                    Sembunyikan produk yang tidak ingin dijual
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline">4</Badge>
                    Tandai produk sebagai promo
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kuota">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold">Kelola Paket Kuota</h2>
                <p className="text-muted-foreground">Atur harga, visibilitas, dan markup paket internet</p>
              </div>
              <Link href="/admin/kuota-products">
                <Button data-testid="button-manage-kuota">
                  <Wifi className="h-4 w-4 mr-2" />
                  Kelola Produk
                </Button>
              </Link>
            </div>

            <Card>
              <CardContent className="py-12 text-center">
                <Wifi className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Pengaturan Paket Kuota</h3>
                <p className="text-muted-foreground mb-4">
                  Klik tombol di atas untuk mengatur harga jual, visibilitas, dan markup paket internet
                </p>
                <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-2">
                  <li className="flex items-center gap-2">
                    <Badge variant="outline">1</Badge>
                    Atur markup global untuk semua paket kuota
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline">2</Badge>
                    Kustomisasi harga per produk
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline">3</Badge>
                    Sembunyikan produk yang tidak ingin dijual
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline">4</Badge>
                    Tandai produk sebagai promo
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}