"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { CheckCircle2, LogIn, MapPin } from "lucide-react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import { submitLocation } from "@/lib/api";
import { MATERIALS, ALL_MATERIALS, ASTANA_CENTER, ASTANA_BOUNDS, MAP_STYLE_LIGHT, MAP_STYLE_DARK } from "@/lib/constants";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import type { MaterialType } from "@/types";
import { cn } from "@/lib/utils";

const LIBRARIES: ("places")[] = [];

// ── Zod schema ────────────────────────────────────────────────
const submitSchema = z.object({
  name: z.string().min(3, "Минимум 3 символа"),
  address: z.string().min(5, "Введите полный адрес"),
  description: z.string().min(10, "Минимум 10 символов"),
  materials: z.array(z.string()).min(1, "Выберите хотя бы один материал"),
  phone: z.string().optional(),
  website: z.string().url("Введите корректный URL").optional().or(z.literal("")),
});

type SubmitFormValues = z.infer<typeof submitSchema>;

// ── Coordinate picker map ─────────────────────────────────────
function CoordinatePicker({
  value,
  onChange,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (pos: { lat: number; lng: number }) => void;
}) {
  const { resolvedTheme } = useTheme();
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: LIBRARIES,
  });

  const handleClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    },
    [onChange]
  );

  if (!isLoaded) {
    return (
      <div className="h-48 rounded-xl border border-border bg-muted flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Загрузка карты…</p>
      </div>
    );
  }

  return (
    <div className="h-48 rounded-xl overflow-hidden border border-border relative">
      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={value ?? { lat: ASTANA_CENTER.lat, lng: ASTANA_CENTER.lng }}
        zoom={value ? 15 : 12}
        options={{
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: "greedy",
          styles: resolvedTheme === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT,
          restriction: { latLngBounds: ASTANA_BOUNDS, strictBounds: false },
          minZoom: 10,
        }}
        onClick={handleClick}
      >
        {value && (
          <Marker
            position={value}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#2ec4b6",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            }}
          />
        )}
      </GoogleMap>
      {!value && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-background/90 border border-border rounded-lg px-3 py-2 flex items-center gap-2 shadow-md">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-medium">Нажмите на карту, чтобы поставить метку</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────

export default function SubmitPage() {
  const { t, lang } = useLang();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [pinPos, setPinPos] = useState<{ lat: number; lng: number } | null>(null);
  const [pinError, setPinError] = useState(false);

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
    if (!pinPos) {
      setPinError(true);
      toast.error("Пожалуйста, укажите местоположение на карте");
      return;
    }
    setPinError(false);
    try {
      await submitLocation({
        name: values.name,
        address: values.address,
        description: values.description,
        materials: values.materials as MaterialType[],
        phone: values.phone,
        website: values.website || undefined,
        lat: pinPos.lat,
        lng: pinPos.lng,
      });
      setSubmitted(true);
    } catch {
      toast.error(t("submit.errorMessage"));
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-6 h-6 text-muted-foreground" />
        </div>
        <h1 className="heading text-xl font-bold mb-2">{t("submit.title")}</h1>
        <p className="text-muted-foreground text-sm mb-6">{t("submit.requiresAuth")}</p>
        <ButtonLink href="/login">{t("submit.loginToSubmit")}</ButtonLink>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-accent" />
        </div>
        <h2 className="heading text-xl font-bold mb-2">{t("submit.successTitle")}</h2>
        <p className="text-muted-foreground text-sm mb-6">{t("submit.successMessage")}</p>
        <div className="flex gap-3 justify-center">
          <ButtonLink href="/map" variant="outline">{t("nav.map")}</ButtonLink>
          <Button onClick={() => { setSubmitted(false); setPinPos(null); }}>
            {t("actions.addAnother")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="heading text-2xl font-bold text-foreground mb-1">{t("submit.title")}</h1>
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
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
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
          {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
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
          {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
        </div>

        {/* Materials */}
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
                        "flex items-center gap-2 text-[12.5px] px-2.5 py-1.5 rounded-lg transition-colors duration-150 text-left border",
                        isChecked
                          ? "border-accent/40 bg-accent/10 text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <span className="w-4 h-4 shrink-0 flex items-center justify-center text-muted-foreground">
                        <MaterialIcon material={m} size={15} />
                      </span>
                      {meta.label[lang]}
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.materials && <p className="text-xs text-destructive">{errors.materials.message}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone">{t("submit.phoneLabel")}</Label>
          <Input id="phone" type="tel" placeholder="+7 (___) ___-__-__" {...register("phone")} />
        </div>

        {/* Website */}
        <div className="space-y-1.5">
          <Label htmlFor="website">{t("submit.websiteLabel")}</Label>
          <Input
            id="website"
            type="url"
            placeholder="https://"
            {...register("website")}
            className={errors.website ? "border-destructive" : ""}
          />
          {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
        </div>

        {/* Coordinate picker */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            {t("submit.mapHint")}
            {pinPos && (
              <span className="ml-auto text-xs text-muted-foreground font-normal">
                {pinPos.lat.toFixed(5)}, {pinPos.lng.toFixed(5)}
              </span>
            )}
          </Label>
          <div className={cn(pinError && !pinPos ? "ring-1 ring-destructive rounded-xl" : "")}>
            <CoordinatePicker value={pinPos} onChange={(p) => { setPinPos(p); setPinError(false); }} />
          </div>
          {pinError && !pinPos && (
            <p className="text-xs text-destructive">Укажите местоположение на карте</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("submit.submitting") : t("submit.submit")}
        </Button>
      </form>
    </div>
  );
}
