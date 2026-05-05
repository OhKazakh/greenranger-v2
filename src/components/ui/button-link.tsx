// ButtonLink: renders a Next.js Link styled as a Button.
// shadcn v4 (Base UI) no longer supports asChild — this is the replacement.

import Link from "next/link";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ButtonLinkProps extends VariantProps<typeof buttonVariants> {
  href: string;
  className?: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
  target,
  rel,
  onClick,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      onClick={onClick}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {children}
    </Link>
  );
}
