import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { updateUserProfile } from "@/lib/users";
import { getUserOrderStats } from "@/lib/orders";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Camera,
  Phone,
  MapPin,
  Mail,
  User,
  Edit2,
  Save,
  X,
  ChevronRight,
  ShoppingBag,
  Package,
  Truck,
  Star,
  Wallet,
  Coins,
  Ticket,
  CreditCard,
  Shield,
  MessageCircle,
  HelpCircle,
  Settings,
  Tag,
} from "lucide-react";

export default function Profile() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Fetch order stats
  const { data: orderStats } = useQuery({
    queryKey: ["orderStats", user?.id],
    queryFn: () => user?.id ? getUserOrderStats(user.id) : null,
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !auth.currentUser) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "File harus berupa gambar",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Ukuran file maksimal 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { imageUrl } = await response.json();

      await updateProfile(auth.currentUser, {
        photoURL: imageUrl,
      });

      await updateUserProfile(user.id, {
        photoURL: imageUrl,
      });

      setUser({
        ...user,
        photoURL: imageUrl,
      });

      toast({
        title: "Berhasil",
        description: "Foto profil berhasil diperbarui",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengupload foto",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !auth.currentUser) return;
    if (displayName.trim().length < 2) {
      toast({
        title: "Error",
        description: "Nama harus minimal 2 karakter",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
      });

      await updateUserProfile(user.id, {
        displayName: displayName.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });

      setUser({
        ...user,
        displayName: displayName.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });

      toast({
        title: "Berhasil",
        description: "Profil berhasil diperbarui",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui profil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Silakan login terlebih dahulu</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header dengan Avatar - Shopee Style */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {/* Avatar dengan Upload */}
            <div className="relative group">
              <Avatar className="h-16 w-16 ring-2 ring-background shadow-lg">
                <AvatarImage src={user.photoURL} alt={user.displayName || user.email} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full cursor-pointer"
                data-testid="button-upload-avatar"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar}
                data-testid="input-avatar"
              />
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground" data-testid="text-username">
                {user.displayName || user.email || "Pengguna"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs" data-testid="text-role">
                  {user.role === "admin" ? "Admin" : "User"}
                </Badge>
                {(user.loyaltyPoints || 0) > 0 && (
                  <Badge variant="default" className="text-xs" data-testid="text-loyalty-points">
                    {user.loyaltyPoints} Poin
                  </Badge>
                )}
              </div>
            </div>

            <Link href="/profile/edit">
              <Button variant="ghost" size="icon" className="shrink-0">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {/* Card Pesanan Saya */}
        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Pesanan Saya</h2>
              <Link href="/pesanan">
                <Button variant="ghost" size="sm" className="text-primary">
                  Lihat Riwayat Pesanan
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {/* Belum Bayar */}
              <Link href="/pesanan?status=pending">
                <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="relative">
                    <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                    {orderStats && orderStats.pendingOrders > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {orderStats.pendingOrders}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-center">Belum Bayar</span>
                </button>
              </Link>

              {/* Dikerjakan */}
              <Link href="/pesanan?status=processing">
                <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="relative">
                    <Package className="h-6 w-6 text-muted-foreground" />
                    {orderStats && orderStats.processingOrders > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                        {orderStats.processingOrders}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-center">Dikerjakan</span>
                </button>
              </Link>

              {/* Selesai */}
              <Link href="/pesanan?status=completed">
                <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="relative">
                    <Star className="h-6 w-6 text-muted-foreground" />
                    {orderStats && orderStats.completedOrders > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                        {orderStats.completedOrders}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-center">Selesai</span>
                </button>
              </Link>

              {/* Beri Penilaian */}
              <Link href="/pesanan?status=completed">
                <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Star className="h-6 w-6 text-yellow-500" />
                  <span className="text-xs text-center">Beri Penilaian</span>
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card Keuangan */}
        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Keuangan</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                Lihat Semua
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* SeaLdo */}
                <button className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">SeaLdo</p>
                    <p className="font-semibold text-sm">Rp {(user.sealdo || 0).toLocaleString("id-ID")}</p>
                  </div>
                </button>

                {/* Poin Saya */}
                <button className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Coins className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Poin Saya</p>
                    <p className="font-semibold text-sm">{user.loyaltyPoints || 0}</p>
                  </div>
                </button>
              </div>

              {/* Voucher - Full Width */}
              <Link href="/layanan" className="block w-full">
                <button className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <Ticket className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">Lihat Voucher</p>
                      <p className="font-semibold text-sm">Voucher Tersedia</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card Bantuan */}
        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Chat dengan Kami</p>
                  <p className="text-sm text-muted-foreground">Butuh bantuan? Hubungi CS</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </a>

              <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <HelpCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Pusat Bantuan</p>
                  <p className="text-sm text-muted-foreground">FAQ & Panduan</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}