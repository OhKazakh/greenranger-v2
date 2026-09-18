"use client";

// Grouped here so next-themes' pre-paint script sits in a client component,
// which avoids a hydration warning in Next 16.

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { LangProvider } from "@/context/LangContext";
import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <LangProvider>
          {children}
          <Toaster richColors position="top-right" />
        </LangProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
