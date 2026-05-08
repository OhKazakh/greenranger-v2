"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { submitLocation } from "@/lib/api";
import { MATERIALS, ALL_MATERIALS } from "@/lib/constants";
import type { MaterialType } from "@/types";
import { cn } from "@/lib/utils";

// ── Zod schema ────────────────────────────────────────────────
// Zod validates the form data shape and constraints.
// zodResolver connects it to react-hook-form.
const submitSchema = z.object({
  name: z.string().min(3, "Минимум 3 символа"),
  address: z.string().min(5, "Введите полный адрес"),
  description: z.string().min(10, "Минимум 10 символов"),
  materials: z.array(z.string()).min(1, "Выберите хотя бы один материал"),
  phone: z.string().optional(),
  website: z.string().url("Введите корректный URL").optional().or(z.literal("")),
});

type SubmitFormValues = z.infer<typeof submitSchema>;

// ────────────────────────────────────────────────────────────

export default function SubmitPage() {
  const { t, lang } = useLang();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<SubmitFormValues>({
    resolver: zodResolver(submitSchema),
    defaultValues: { materials: [] },
  });

  const selectedMaterials = watch("materials");

  const onSubmit = async (values: SubmitFormValues) => {
    try {
      await submitLocation({
        name: values.name,
        address: values.address,
        description: values.description,
        materials: values.materials as MaterialType[],
        phone: values.phone,
        website: values.website || undefined,
        lat: 51.1282, // In a real app this would come from a map click
        lng: 71.4306,
      });
      setSubmitted(true);
    } catch {
      toast.error(t("submit.errorMessage"));
    }
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  // Not logged in — gate
  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-6 h-6 text-muted-foreground" />
        </div>
        <h1 className="heading text-xl font-bold mb-2">{t("submit.title")}</h1>
        <p className="text-muted-foreground text-sm mb-6">
          {t("submit.requiresAuth")}
        </p>
        <ButtonLink href="/login">{t("submit.loginToSubmit")}</ButtonLink>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-accent" />
        </div>
        <h2 className="heading text-xl font-bold mb-2">{t("submit.successTitle")}</h2>
        <p className="text-muted-foreground text-sm mb-6">
          {t("submit.successMessage")}
        </p>
        <div className="flex gap-3 justify-center">
          <ButtonLink href="/map" variant="outline">{t("nav.map")}</ButtonLink>
          <Button onClick={() => setSubmitted(false)}>
            Добавить ещё
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading text-2xl font-bold text-foreground mb-1">
          {t("submit.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("submit.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("submit.nameLabel")}</Label>
          <Input
            id="name"
            placeholder={t("submit.namePlaceholder")}
            {...register("name")}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <Label htmlFor="address">{t("submit.addressLabel")}</Label>
          <Input
            id="address"
            placeholder={t("submit.addressPlaceholder")}
            {...register("address")}
            className={errors.address ? "border-destructive" : ""}
          />
          {errors.address && (
            <p className="text-xs text-destructive">{errors.address.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">{t("submit.descriptionLabel")}</Label>
          <textarea
            id="description"
            rows={3}
            placeholder={t("submit.descriptionPlaceholder")}
            {...register("description")}
            className={cn(
              "w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm",
              "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "resize-none",
              errors.description ? "border-destructive" : "border-input"
            )}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        {/* Materials — custom multi-checkbox */}
        <div className="space-y-1.5">
          <Label>{t("submit.materialsLabel")}</Label>
          <Controller
            name="materials"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {ALL_MATERIALS.map((m) => {
                  const meta = MATERIALS[m];
                  const isChecked = field.value.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          field.onChange(field.value.filter((v: string) => v !== m));
                        } else {
                          field.onChange([...field.value, m]);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                        isChecked
                          ? "text-white border-transparent " + meta.color
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                      )}
                    >
                      <span>{meta.icon}</span>
                      {meta.label[lang]}
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.materials && (
            <p className="text-xs text-destructive">{errors.materials.message}</p>
          )}
        </div>

        {/* Phone (optional) */}
        <div className="space-y-1.5">
          <Label htmlFor="phone">{t("submit.phoneLabel")}</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+7 (___) ___-__-__"
            {...register("phone")}
          />
        </div>

        {/* Website (optional) */}
        <div className="space-y-1.5">
          <Label htmlFor="website">{t("submit.websiteLabel")}</Label>
          <Input
            id="website"
            type="url"
            placeholder="https://"
            {...register("website")}
            className={errors.website ? "border-destructive" : ""}
          />
          {errors.website && (
            <p className="text-xs text-destructive">{errors.website.message}</p>
          )}
        </div>

        {/* Map coordinate hint */}
        <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
          📍 {t("submit.mapHint")} — <span className="text-accent">будет добавлено в следующей версии</span>
        </p>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("submit.submitting") : t("submit.submit")}
        </Button>
      </form>
    </div>
  );
}
