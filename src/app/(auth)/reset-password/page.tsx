"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useRouter } from "next/navigation";
import { KeyRound, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

const schema = z.object({
  password: z.string().min(8, "Минимум 8 символов"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Пароли не совпадают",
  path: ["confirm"],
});

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <div className="text-center">
        <XCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Недействительная ссылка. Запросите сброс заново.</p>
        <Link href="/forgot-password" className="text-sm text-accent hover:underline mt-4 inline-block">
          Запросить снова
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-accent" />
        </div>
        <h2 className="heading text-xl font-bold mb-2">Пароль изменён</h2>
        <p className="text-sm text-muted-foreground mb-6">Теперь вы можете войти с новым паролем.</p>
        <Button onClick={() => router.push("/login")} className="w-full">Войти</Button>
      </div>
    );
  }

  const onSubmit = async ({ password }: { password: string; confirm: string }) => {
    setError("");
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch {
      setError("Ссылка недействительна или срок истёк. Запросите сброс заново.");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
          <KeyRound className="w-4.5 h-4.5 text-accent" />
        </div>
        <div>
          <h1 className="heading text-xl font-bold">Новый пароль</h1>
          <p className="text-xs text-muted-foreground">Придумайте надёжный пароль</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">Новый пароль</Label>
          <Input
            id="password"
            type="password"
            placeholder="Минимум 8 символов"
            {...register("password")}
            className={errors.password ? "border-destructive" : ""}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Повторите пароль</Label>
          <Input
            id="confirm"
            type="password"
            placeholder="Повторите пароль"
            {...register("confirm")}
            className={errors.confirm ? "border-destructive" : ""}
          />
          {errors.confirm && (
            <p className="text-xs text-destructive">{errors.confirm.message}</p>
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Сохранение…" : "Сохранить пароль"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
