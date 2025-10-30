
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Lock,
  Loader2,
  Camera,
} from "lucide-react";

export default function Profile() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdateName = async () => {
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

      setUser({
        ...user,
        displayName: displayName.trim(),
      });

      toast({
        title: "Berhasil",
        description: "Nama berhasil diperbarui",
      });
      setIsEditingName(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui nama",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!auth.currentUser) return;
    
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password minimal 6 karakter",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Password tidak cocok",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      
      toast({
        title: "Berhasil",
        description: "Password berhasil diubah",
      });
      
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengubah password. Anda mungkin perlu login ulang.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Silakan login terlebih dahulu</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Profile Saya</h1>
          <p className="text-muted-foreground">
            Kelola informasi akun Anda
          </p>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 md:h-32 md:w-32">
                  <AvatarImage src={user.photoURL} alt={user.displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-3xl md:text-4xl">
                    {user.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="text-center md:text-left flex-1">
                <CardTitle className="text-2xl mb-2">{user.displayName}</CardTitle>
                <CardDescription className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 justify-center md:justify-start">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </span>
                  <span className="flex items-center gap-2 justify-center md:justify-start">
                    <Shield className="h-4 w-4" />
                    Role: <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Account Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Nama Lengkap</Label>
              {isEditingName ? (
                <div className="flex gap-2">
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleUpdateName}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Simpan"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingName(false);
                      setDisplayName(user.displayName);
                    }}
                    disabled={isLoading}
                  >
                    Batal
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span>{user.displayName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingName(true)}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Email */}
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">{user.email}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Email tidak dapat diubah
              </p>
            </div>

            <Separator />

            {/* Role */}
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="p-3 bg-muted rounded-lg">
                <Badge variant="secondary" className="capitalize">
                  {user.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Keamanan
            </CardTitle>
            <CardDescription>
              Kelola password dan keamanan akun Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isChangingPassword ? (
              <Button
                variant="outline"
                onClick={() => setIsChangingPassword(true)}
              >
                Ubah Password
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password baru"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleChangePassword}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Password"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    disabled={isLoading}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
