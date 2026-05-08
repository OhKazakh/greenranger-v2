"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { TKey } from "@/context/LangContext";

// ── Nav links ─────────────────────────────────────────────────
const NAV_LINKS: { href: string; labelKey: TKey }[] = [
  { href: "/map", labelKey: "nav.map" },
  { href: "/locations", labelKey: "nav.locations" },
  { href: "/submit", labelKey: "nav.submit" },
  { href: "/about", labelKey: "nav.about" },
];

export function Navbar() {
  const { t } = useLang();
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLink = ({
    href,
    labelKey,
    onClick,
  }: {
    href: string;
    labelKey: TKey;
    onClick?: () => void;
  }) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "text-sm font-medium transition-colors duration-150",
          isActive
            ? "text-accent"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {t(labelKey)}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/map" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Leaf className="w-4 h-4 text-accent" />
          </div>
          <span className="heading text-sm font-bold text-foreground hidden sm:block">
            GreenRanger
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} labelKey={link.labelKey} />
          ))}
        </nav>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Separator orientation="vertical" className="h-5" />
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5" />
                {user?.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-xs h-8"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                {t("nav.logout")}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <ButtonLink href="/login" variant="ghost" size="sm" className="text-xs h-8">{t("nav.login")}</ButtonLink>
              <ButtonLink href="/register" size="sm" className="text-xs h-8">{t("nav.register")}</ButtonLink>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-foreground">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-10">
              <div className="flex flex-col gap-6">
                {/* Mobile links */}
                <nav className="flex flex-col gap-4">
                  {NAV_LINKS.map((link) => (
                    <NavLink
                      key={link.href}
                      href={link.href}
                      labelKey={link.labelKey}
                      onClick={() => setMobileOpen(false)}
                    />
                  ))}
                </nav>

                <Separator />
                <LanguageSwitcher />
                <Separator />

                {/* Mobile auth */}
                {isAuthenticated ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground">
                      {user?.name} · {user?.email}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                    >
                      <LogOut className="w-3.5 h-3.5 mr-2" />
                      {t("nav.logout")}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <ButtonLink href="/login" variant="outline" size="sm" onClick={() => setMobileOpen(false)}>{t("nav.login")}</ButtonLink>
                    <ButtonLink href="/register" size="sm" onClick={() => setMobileOpen(false)}>{t("nav.register")}</ButtonLink>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
