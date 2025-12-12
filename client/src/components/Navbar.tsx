import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Briefcase, ShoppingBag, LayoutDashboard, LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";


export function Navbar({ className = "" }: { className?: string }) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, setUser } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    window.location.href = "/login";
  };

  const navLinks = user?.role === "admin"
    ? [
        { href: "/beranda", label: "Beranda", icon: LayoutDashboard },
        { href: "/admin", label: "Admin Panel", icon: LayoutDashboard },
        { href: "/layanan", label: "Layanan", icon: Briefcase },
        { href: "/pesanan", label: "Pesanan Saya", icon: ShoppingBag },
      ]
    : user
    ? [
        { href: "/beranda", label: "Beranda", icon: LayoutDashboard },
        { href: "/layanan", label: "Layanan", icon: Briefcase },
        { href: "/pesanan", label: "Pesanan Saya", icon: ShoppingBag },
      ]
    : [
        { href: "/layanan", label: "Layanan", icon: Briefcase },
      ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href={user ? "/beranda" : "/login"} data-testid="link-home">
            <div className="flex items-center gap-2 hover-elevate active-elevate-2 px-3 py-2 rounded-lg transition-all cursor-pointer">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                SeaVice
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  className="font-medium"
                  data-testid={`link-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-full p-1 transition-all" data-testid="button-user-menu">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.photoURL} alt={user.displayName} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2">
                    <p className="text-sm font-medium">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Role: <span className="font-semibold capitalize">{user.role}</span>
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem>
                      Profile Saya
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={handleSignOut} data-testid="button-logout">
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" data-testid="button-login">
                    Masuk
                  </Button>
                </Link>
                <Link href="/register">
                  <Button data-testid="button-register">Daftar Sekarang</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover-elevate active-elevate-2 rounded-lg transition-all"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Menu - Side Drawer */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[80%] sm:w-[350px] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu Navigasi</SheetTitle>
              <SheetDescription>Navigasi aplikasi SeaVice</SheetDescription>
            </SheetHeader>
            
            <div className="flex flex-col h-full bg-background">
              {/* Header dengan Title */}
              <div className="px-6 py-5 border-b">
                <h2 className="text-xl font-bold text-foreground">
                  SeaVice
                </h2>
              </div>

              {/* User Info Section */}
              {user && (
                <div className="px-6 py-6 border-b">
                  <Link href="/profile">
                    <button
                      className="w-full flex items-center gap-3 hover:bg-gray-50 rounded-lg p-3 -m-3 transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={user.photoURL} alt={user.displayName} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                          {user.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-foreground truncate">
                          {user.displayName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </Link>
                </div>
              )}

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Navigation
                  </div>
                  <div className="flex flex-col gap-1">
                    {navLinks.map((link) => {
                      const Icon = link.icon;
                      const isActive = location === link.href;
                      return (
                        <Link key={link.href} href={link.href}>
                          <button
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                              isActive
                                ? "bg-orange-50 text-orange-600 font-medium"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                            data-testid={`link-mobile-${link.label.toLowerCase()}`}
                          >
                            <Icon className={`h-5 w-5 ${isActive ? "text-orange-600" : "text-gray-500"}`} />
                            <span className="text-sm">{link.label}</span>
                          </button>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Auth Section */}
                {user ? (
                  <div className="px-6 py-4 border-t">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Account
                    </div>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-50 transition-all"
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      data-testid="button-mobile-logout"
                    >
                      <LogOut className="h-5 w-5 text-gray-500" />
                      <span className="text-sm">Log out</span>
                    </button>
                  </div>
                ) : (
                  <div className="px-6 py-4 border-t space-y-2">
                    <Link href="/login">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid="button-mobile-login"
                      >
                        Masuk
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button
                        className="w-full"
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid="button-mobile-register"
                      >
                        Daftar Sekarang
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t">
                <p className="text-xs text-center text-muted-foreground">
                  © 2025 SeaVice. All rights reserved.
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}