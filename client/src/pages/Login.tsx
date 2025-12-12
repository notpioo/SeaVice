import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmail, signInWithGoogle } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [tempUser, setTempUser] = useState<any>(null); // Temporary storage for user data from Google sign-in

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const user = await signInWithEmail(data.email, data.password);
      setUser(user);

      // Show success toast
      toast({
        title: "Login berhasil!",
        description: `Selamat datang kembali, ${user.displayName}`,
      });

      // Use window.location for more reliable redirect
      setTimeout(() => {
        if (user.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/beranda";
        }
      }, 500);
    } catch (error: any) {
      toast({
        title: "Login gagal",
        description: error.message || "Email atau password salah",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const user = await signInWithGoogle();
      setUser(user);

      if (!user.phone) {
        // If user doesn't have a phone number, prompt them to enter it
        setTempUser(user); // Store user data temporarily
        setShowPhoneDialog(true);
        setIsLoading(false); // Stop loading indicator as we are showing a dialog
        return; // Exit the function here to prevent immediate redirect
      }

      toast({
        title: "Login berhasil!",
        description: `Selamat datang, ${user.displayName}`,
      });

      // Use window.location for more reliable redirect
      setTimeout(() => {
        if (user.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/beranda";
        }
      }, 500);
    } catch (error: any) {
      toast({
        title: "Login gagal",
        description: error.message || "Terjadi kesalahan saat login dengan Google",
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
        title: "Login berhasil!",
        description: `Selamat datang, ${updatedUser.displayName}`,
      });

      setShowPhoneDialog(false);
      setTimeout(() => {
        if (updatedUser.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/beranda";
        }
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
            <CardTitle className="text-2xl font-bold">Masuk</CardTitle>
            <CardDescription>
              Masukkan email dan password Anda untuk login
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    "Masuk"
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
              Belum punya akun?{" "}
              <Link href="/register" className="text-primary font-medium hover:underline" data-testid="link-register">
                Daftar sekarang
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Dialog for entering phone number after Google sign-in */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Lengkapi Profil Anda</DialogTitle>
            <DialogDescription>
              Mohon masukkan nomor WhatsApp Anda untuk melanjutkan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phoneNumber" className="text-right">
                Nomor WhatsApp
              </Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setPhoneError(""); // Clear error on input change
                }}
                className="col-span-3"
                placeholder="+6281234567890"
                disabled={isLoading}
                data-testid="input-phone-number"
              />
            </div>
            {phoneError && <p className="text-red-500 text-sm col-span-4 -mt-2" data-testid="phone-error">{phoneError}</p>}
          </div>
          <DialogFooter>
            <Button onClick={handlePhoneSubmit} disabled={isLoading} data-testid="button-submit-phone">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Simpan & Lanjutkan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}