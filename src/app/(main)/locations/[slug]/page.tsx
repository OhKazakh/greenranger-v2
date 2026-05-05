"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Clock, Phone, Globe, ArrowLeft,
  CheckCircle2, Image as ImageIcon, ChevronDown
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MaterialBadge } from "@/components/shared/MaterialBadge";
import { useLang } from "@/context/LangContext";
import { getLocationBySlug } from "@/lib/api";
import { MARKER_COLORS } from "@/lib/constants";
import type { Location } from "@/types";
import dynamic from "next/dynamic";

// Mini-map: we keep this as a plain import because the detail page
// is already "use client", so Leaflet won't run on the server here.
// However we still lazy-load it for code-splitting.
const MiniMap = dynamic(() => import("@/components/map/MiniMap"), { ssr: false });

function DetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function LocationDetailPage() {
  const params = useParams<{ slug: string }>();
  const { lang, t } = useLang();
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [photosOpen, setPhotosOpen] = useState(false);

  useEffect(() => {
    if (!params.slug) return;
    setIsLoading(true);
    getLocationBySlug(params.slug)
      .then(setLocation)
      .finally(() => setIsLoading(false));
  }, [params.slug]);

  if (isLoading) return <DetailSkeleton />;

  if (!location) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">Пункт не найден</p>
        <ButtonLink href="/locations" variant="outline">{t("location.backToList")}</ButtonLink>
      </div>
    );
  }

  const dotColor = location.category === "hub" ? MARKER_COLORS.hub : MARKER_COLORS.kiosk;
  const hasPhotos = location.photos.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Back link */}
      <Link
        href="/locations"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {t("location.backToList")}
      </Link>

      {/* Accent bar */}
      <div
        className="h-1 w-16 rounded-full mb-4"
        style={{ backgroundColor: dotColor }}
      />

      {/* Category + verified */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: dotColor }}
        >
          {location.category === "hub" ? t("location.hub") : t("location.kiosk")}
        </span>
        {location.verified && (
          <span className="flex items-center gap-1 text-xs text-[#2EC4B6]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t("location.verified")}
          </span>
        )}
      </div>

      {/* Name */}
      <h1 className="heading text-2xl font-bold text-foreground mb-4">
        {location.name[lang]}
      </h1>

      {/* Description */}
      <p className="text-base text-muted-foreground leading-relaxed mb-6">
        {location.description[lang]}
      </p>

      <Separator className="mb-6" />

      {/* Info grid */}
      <div className="space-y-4 mb-6">
        {/* Address */}
        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">{t("location.address")}</p>
            <p className="text-sm font-medium">{location.address[lang]}</p>
          </div>
        </div>

        {/* Schedule */}
        {location.schedule && (
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t("location.schedule")}</p>
              <div className="space-y-0.5 text-sm">
                <p>
                  <span className="text-muted-foreground">{t("location.weekdays")}: </span>
                  <span className="font-medium">{location.schedule.weekdays}</span>
                </p>
                {location.schedule.saturday && (
                  <p>
                    <span className="text-muted-foreground">{t("location.saturday")}: </span>
                    <span className="font-medium">{location.schedule.saturday}</span>
                  </p>
                )}
                <p>
                  <span className="text-muted-foreground">{t("location.sunday")}: </span>
                  <span className={location.schedule.sunday ? "font-medium" : "text-destructive font-medium"}>
                    {location.schedule.sunday ?? t("location.closed")}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Phone */}
        {location.phone && (
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{t("location.phone")}</p>
              <a href={`tel:${location.phone}`} className="text-sm font-medium text-[#2EC4B6] hover:underline">
                {location.phone}
              </a>
            </div>
          </div>
        )}

        {/* Website */}
        {location.website && (
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{t("location.website")}</p>
              <a
                href={location.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#2EC4B6] hover:underline"
              >
                {location.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </div>
        )}
      </div>

      <Separator className="mb-6" />

      {/* Materials */}
      <div className="mb-6">
        <h2 className="heading text-sm font-bold text-foreground mb-3">
          {t("location.materials")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {location.materials.map((m) => (
            <MaterialBadge key={m} material={m} />
          ))}
        </div>
      </div>

      {/* Photos */}
      <div className="mb-6">
        <button
          onClick={() => setPhotosOpen(!photosOpen)}
          disabled={!hasPhotos}
          className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ImageIcon className="w-4 h-4" />
          {t("location.photos")}
          {hasPhotos && (
            <>
              <span className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
                {location.photos.length}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${photosOpen ? "rotate-180" : ""}`} />
            </>
          )}
          {!hasPhotos && (
            <span className="text-xs text-muted-foreground font-normal">({t("location.noPhotos")})</span>
          )}
        </button>

        {photosOpen && hasPhotos && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {location.photos.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`${location.name[lang]} — фото ${i + 1}`}
                className="w-full h-32 object-cover rounded-xl"
              />
            ))}
          </div>
        )}
      </div>

      <Separator className="mb-6" />

      {/* Mini map */}
      <div className="mb-6">
        <h2 className="heading text-sm font-bold text-foreground mb-3">
          На карте
        </h2>
        <div className="h-48 rounded-xl overflow-hidden border border-border">
          <MiniMap position={location.position} name={location.name[lang]} />
        </div>
      </div>

      {/* CTA */}
      <ButtonLink href="/map" className="w-full">{t("location.viewOnMap")}</ButtonLink>
    </div>
  );
}
