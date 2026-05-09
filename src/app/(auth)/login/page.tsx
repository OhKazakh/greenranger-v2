"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { login } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useLang();
  const { setUser } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      const user = await login(values);
      setUser(user);
      toast.success(t("auth.welcome").replace("{{name}}", user.name));
      router.push("/map");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.errors.invalidCredentials"));
    }
  };

  return (
    <>
      <h1 className="heading text-xl font-bold text-foreground mb-6 text-center">
        {t("auth.loginTitle")}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth.emailLabel")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.passwordLabel")}</Label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder={t("auth.passwordPlaceholder")}
            {...register("password")}
            className={errors.password ? "border-destructive" : ""}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("auth.loggingIn") : t("auth.loginButton")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-5">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="text-accent hover:underline font-medium">
          {t("auth.registerLink")}
        </Link>
      </p>
    </>
  );
}
