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
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <Leaf className="w-5 h-5 text-accent" />
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
