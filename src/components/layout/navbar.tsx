"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

interface NavbarProps {
  variant?: "landing" | "app";
}

export function Navbar({ variant = "landing" }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  if (variant === "landing") {
    return (
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gradient-start to-gradient-end">
              <span className="text-lg font-bold text-white">S</span>
            </div>
            <span className="text-xl font-bold">StreamFetch</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </Link>
            <Link
              href="/youtube"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              YouTube
            </Link>
            <Link
              href="/dubbing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Dubbing
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t md:hidden">
            <div className="container space-y-1 px-4 py-4">
              <Link
                href="#features"
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="/youtube"
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                YouTube
              </Link>
              <Link
                href="/dubbing"
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dubbing
              </Link>
              <div className="space-y-2 pt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard">Sign In</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link href="/dashboard">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    );
  }

  // App variant
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-gradient-start to-gradient-end">
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <span className="text-lg font-bold">StreamFetch</span>
        </Link>

        {/* Breadcrumbs */}
        <div className="hidden md:flex md:items-center md:space-x-2 md:text-sm">
          <span className="text-muted-foreground">/</span>
          <span className="font-medium capitalize">
            {pathname.split("/")[1] || "Dashboard"}
          </span>
          {pathname.split("/")[2] && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium capitalize">
                {pathname.split("/")[2]}
              </span>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              JD
            </div>
          </Button>
        </div>
      </div>
    </nav>
  );
}
