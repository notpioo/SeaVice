import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { registerWithEmail, signInWithGoogle } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const registerSchema = z.object({
  displayName: z.string().min(2, "Nama harus minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().min(10, "Nomor WhatsApp minimal 10 digit").regex(/^(\+62|62|0)[0-9]{9,12}$/, "Format nomor WhatsApp tidak valid (contoh: 081234567890)"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [tempUser, setTempUser] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const user = await registerWithEmail(data.email, data.password, data.displayName, data.phone);
      setUser(user);

      toast({
        title: "Registrasi berhasil!",
        description: `Selamat datang, ${user.displayName}`,
      });

      // Use window.location for more reliable redirect
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (error: any) {
      toast({
        title: "Registrasi gagal",
        description: error.message || "Terjadi kesalahan saat mendaftar",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const user = await signInWithGoogle();
      
      // Check if user already has phone number
      if (!user.phone) {
        setTempUser(user);
        setShowPhoneDialog(true);
        setIsLoading(false);
      } else {
        setUser(user);
        toast({
          title: "Registrasi berhasil!",
          description: `Selamat datang, ${user.displayName}`,
        });

        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      }
    } catch (error: any) {
      toast({
        title: "Registrasi gagal",
        description: error.message || "Terjadi kesalahan saat registrasi dengan Google",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async () => {
    // Validate phone number
    const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
    if (!phoneNumber || phoneNumber.length < 10) {
      setPhoneError("Nomor WhatsApp minimal 10 digit");
      return;
    }
    if (!phoneRegex.test(phoneNumber)) {
      setPhoneError("Format nomor WhatsApp tidak valid (contoh: 081234567890)");
      return;
    }

    setIsLoading(true);
    try {
      // Update user document with phone number
      await updateDoc(doc(db, "users", tempUser.id), {
        phone: phoneNumber,
      });

      const updatedUser = { ...tempUser, phone: phoneNumber };
      setUser(updatedUser);

      toast({
        title: "Registrasi berhasil!",
        description: `Selamat datang, ${updatedUser.displayName}`,
      });

      setShowPhoneDialog(false);
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (error: any) {
      toast({
        title: "Gagal menyimpan nomor WhatsApp",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent cursor-pointer inline-block">
              SeaVice
            </h1>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Daftar</CardTitle>
            <CardDescription>
              Buat akun baru untuk mengakses layanan SeaVice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          {...field}
                          disabled={isLoading}
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="nama@email.com"
                          {...field}
                          disabled={isLoading}
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor WhatsApp</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="081234567890"
                          {...field}
                          disabled={isLoading}
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          disabled={isLoading}
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konfirmasi Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          disabled={isLoading}
                          data-testid="input-confirm-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-submit"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Daftar"
                  )}
                </Button>
              </form>
            </Form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Atau lanjutkan dengan
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              data-testid="button-google"
            >
              <SiGoogle className="mr-2 h-4 w-4" />
              Google
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground text-center">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline" data-testid="link-login">
                Masuk sekarang
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Phone Number Dialog for Google Sign-in */}
        <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Lengkapi Data Anda</DialogTitle>
              <DialogDescription>
                Masukkan nomor WhatsApp untuk melanjutkan pendaftaran
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Nomor WhatsApp
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="081234567890"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setPhoneError("");
                  }}
                  disabled={isLoading}
                />
                {phoneError && (
                  <p className="text-sm text-destructive">{phoneError}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handlePhoneSubmit}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Lanjutkan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}