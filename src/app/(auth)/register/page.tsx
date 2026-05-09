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
import { register as apiRegister } from "@/lib/api";

const registerSchema = z.object({
  name: z.string().min(2, "Введите имя"),
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { t } = useLang();
  const { setUser } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterValues) => {
    try {
      const user = await apiRegister(values);
      setUser(user);
      toast.success(t("auth.welcome").replace("{{name}}", user.name));
      router.push("/map");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка регистрации");
    }
  };

  return (
    <>
      <h1 className="heading text-xl font-bold text-foreground mb-6 text-center">
        {t("auth.registerTitle")}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("auth.nameLabel")}</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder={t("auth.namePlaceholder")}
            {...register("name")}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

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
          <Label htmlFor="password">{t("auth.passwordLabel")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder={t("auth.passwordPlaceholder")}
            {...register("password")}
            className={errors.password ? "border-destructive" : ""}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("auth.registering") : t("auth.registerButton")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-5">
        {t("auth.hasAccount")}{" "}
        <Link href="/login" className="text-accent hover:underline font-medium">
          {t("auth.loginLink")}
        </Link>
      </p>
    </>
  );
}
