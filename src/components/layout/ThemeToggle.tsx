"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/context/LangContext";

// Follows the system appearance until someone picks one here; the pick is an
// override for this site only, since visitors can't set appearance per site.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useLang();
  const [mounted, setMounted] = useState(false);

  // The server can't know the visitor's appearance, so render a stable placeholder until mounted.
  useEffect(() => setMounted(true), []);

  const size = "h-11 w-11 md:h-8 md:w-8";

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={size} aria-hidden="true">
        <span className="w-4 h-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={size}
      aria-label={isDark ? t("nav.themeLight") : t("nav.themeDark")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
