import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-muted/50 via-muted/30 to-background border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col items-center justify-center gap-6">
          {/* Brand */}
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
              SeaVice
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Platform terpercaya untuk berbagai layanan digital profesional
            </p>
          </div>

          {/* Social Media */}
          <div className="flex gap-4">
            <a
              href="#"
              className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all hover:scale-110"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5 text-primary" />
            </a>
            <a
              href="#"
              className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all hover:scale-110"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5 text-primary" />
            </a>
            <a
              href="#"
              className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all hover:scale-110"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5 text-primary" />
            </a>
            <a
              href="#"
              className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all hover:scale-110"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5 text-primary" />
            </a>
          </div>

          {/* Copyright */}
          <div className="pt-6 border-t w-full">
            <p className="text-sm text-muted-foreground text-center">
              &copy; {new Date().getFullYear()} SeaVice. Seluruh hak cipta dilindungi.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}