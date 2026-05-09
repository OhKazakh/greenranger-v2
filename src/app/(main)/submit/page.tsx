"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useCallback, useRef } from "react";
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
  phone: z.string().regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/, "Введите номер в формате +7 (XXX) XXX-XX-XX").optional().or(z.literal("")),
  website: z.string().url("Введите корректный URL").optional().or(z.literal("")),
});

type SubmitFormValues = z.infer<typeof submitSchema>;

// ── Ripple animation styles ───────────────────────────────────
const rippleKeyframes = `
@keyframes map-ripple {
  0%   { transform: translate(-50%,-50%) scale(0.4); opacity: 0.8; }
  100% { transform: translate(-50%,-50%) scale(2.8); opacity: 0; }
}
@keyframes map-drop {
  0%   { transform: translate(-50%, -200%) scale(0.6); opacity: 0; }
  60%  { transform: translate(-50%, 8%) scale(1.15); opacity: 1; }
  80%  { transform: translate(-50%, -6%) scale(0.95); }
  100% { transform: translate(-50%, 0%)  scale(1); opacity: 1; }
}
`;

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
  const mapRef = useRef<google.maps.Map | null>(null);
  const [ripple, setRipple] = useState<{ x: number; y: number; key: number } | null>(null);

  const handleClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });

      // Convert lat/lng to pixel position for ripple
      if (mapRef.current) {
        const proj = mapRef.current.getProjection();
        const bounds = mapRef.current.getBounds();
        const mapDiv = mapRef.current.getDiv();
        if (proj && bounds && mapDiv) {
          const ne = proj.fromLatLngToPoint(bounds.getNorthEast()!);
          const sw = proj.fromLatLngToPoint(bounds.getSouthWest()!);
          const scale = Math.pow(2, mapRef.current.getZoom()!);
          const pt = proj.fromLatLngToPoint(e.latLng)!;
          if (!ne || !sw || !pt) return;
          const x = (pt.x - sw.x) * scale;
          const y = (pt.y - ne.y) * scale;
          setRipple({ x, y, key: Date.now() });
          setTimeout(() => setRipple(null), 700);
        }
      }
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
      <style>{rippleKeyframes}</style>
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
        onLoad={(map) => { mapRef.current = map; }}
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

      {/* Click ripple overlay */}
      {ripple && (
        <div
          key={ripple.key}
          className="pointer-events-none absolute"
          style={{ left: ripple.x, top: ripple.y }}
        >
          {/* Drop animation on the dot */}
          <div
            className="absolute w-4 h-4 rounded-full bg-accent"
            style={{
              transform: "translate(-50%, -50%)",
              animation: "map-drop 0.45s cubic-bezier(.22,.61,.36,1) forwards",
            }}
          />
          {/* Ripple ring */}
          <div
            className="absolute w-8 h-8 rounded-full border-2 border-accent"
            style={{
              animation: "map-ripple 0.65s ease-out forwards",
            }}
          />
        </div>
      )}

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
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Input
                id="phone"
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={field.value ?? ""}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                  let formatted = "";
                  if (digits.length === 0) {
                    formatted = "";
                  } else {
                    const d = digits.startsWith("8") ? "7" + digits.slice(1) : digits;
                    const n = d.startsWith("7") ? d : "7" + d;
                    const trimmed = n.slice(0, 11);
                    formatted = "+7";
                    if (trimmed.length > 1) formatted += " (" + trimmed.slice(1, 4);
                    if (trimmed.length > 4) formatted += ") " + trimmed.slice(4, 7);
                    if (trimmed.length > 7) formatted += "-" + trimmed.slice(7, 9);
                    if (trimmed.length > 9) formatted += "-" + trimmed.slice(9, 11);
                  }
                  field.onChange(formatted);
                }}
                className={errors.phone ? "border-destructive" : ""}
              />
            )}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
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
