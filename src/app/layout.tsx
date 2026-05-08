import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenRanger — Карта переработки Астаны",
  description:
    "Найдите ближайший пункт раздельного сбора отходов в Астане. Пластик, бумага, стекло, металл и другие материалы.",
  keywords: ["переработка", "Астана", "вторсырьё", "раздельный сбор", "экология"],
  openGraph: {
    title: "GreenRanger",
    description: "Карта пунктов переработки Астаны",
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
