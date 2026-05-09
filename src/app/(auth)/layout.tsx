import Link from "next/link";
import { Leaf } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      {/* Logo */}
      <Link href="/map" className="flex items-center gap-2 mb-8">
        <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--forest)" }}
          >
            <Leaf className="w-4 h-4" style={{ color: "var(--teal)" }} />
          </div>
        <span className="heading text-lg font-bold">GreenRanger</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-lg">
        {children}
      </div>
    </div>
  );
}
