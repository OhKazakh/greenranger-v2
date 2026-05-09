import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenRanger — Astana",
  description:
    "Find the nearest recycling point in Astana. Plastic, paper, glass, metal and more.",
  keywords: ["recycling", "Astana", "ecology", "переработка", "Астана", "экология"],
  openGraph: {
    title: "GreenRanger — Astana",
    description: "Recycling map of Astana",
    locale: "ru_KZ",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
