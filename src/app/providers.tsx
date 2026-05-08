"use client";

// ────────────────────────────────────────────────────────────
//  Client-side providers wrapper.
//
//  Why this file exists:
//  next-themes injects a `<script>` element to set the theme
//  before paint (avoids flash of wrong theme). In Next.js 16,
//  inline scripts inside Server Components trigger a warning
//  because they don't execute on rehydration.
//
//  Wrapping all providers in a single "use client" component
//  silences the warning and keeps the providers grouped.
// ────────────────────────────────────────────────────────────

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { LangProvider } from "@/context/LangContext";
import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
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
