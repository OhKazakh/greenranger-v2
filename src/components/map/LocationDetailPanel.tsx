"use client";

import { X, MapPin, Clock, Phone, Globe, CheckCircle2, Image as ImageIcon, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { Separator } from "@/components/ui/separator";
import { MaterialBadge } from "@/components/shared/MaterialBadge";
import { useLang } from "@/context/LangContext";
import { MARKER_COLORS } from "@/lib/constants";
import type { Location } from "@/types";
import { cn } from "@/lib/utils";

interface LocationDetailPanelProps {
  location: Location | null;
  onClose: () => void;
}

// Must match the exit animation duration in globals.css
// (slide-down 0.22s, fade-out 0.22s)
const EXIT_DURATION_MS = 220;

export function LocationDetailPanel({ location, onClose }: LocationDetailPanelProps) {
  const { lang, t } = useLang();
  const [photosOpen, setPhotosOpen] = useState(false);

  // ── Exit animation state machine ─────────────────────────────
  // We need to keep rendering the previous location during the
  // exit animation, so we maintain our own copy and a flag.
  //
  //  parent:    location=A   →   location=null  →    (250ms)    → unmounted
  //  internal:  shown=A      →   shown=A,exit=true  → shown=null
  //
  const [shown, setShown] = useState<Location | null>(location);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (location) {
      // Opening / switching → show immediately, cancel any exit
      setShown(location);
      setIsExiting(false);
      return;
    }
    // location became null → start exit animation
    if (shown) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setShown(null);
        setIsExiting(false);
      }, EXIT_DURATION_MS);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // Wrapped close — kicks off the exit animation by telling the parent
  // to clear its state. Our useEffect above handles the rest.
  const handleClose = () => {
    if (!isExiting) onClose();
  };

  if (!shown) return null;

  const isHub = shown.category === "hub";
  const dotColor = isHub ? MARKER_COLORS.hub : MARKER_COLORS.kiosk;
  const hasPhotos = shown.photos.length > 0;

  return (
    <>
      {/* Backdrop (mobile only) */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-30 bg-black/40",
          isExiting ? "backdrop-fade-out" : "backdrop-fade-in"
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          // Mobile: slide up from bottom
          "fixed bottom-0 left-0 right-0 z-40 rounded-t-2xl",
          // Desktop: fixed right panel inside the map wrapper
          "md:absolute md:top-4 md:right-4 md:bottom-4 md:left-auto md:w-80 md:rounded-xl",
          "bg-background border border-border shadow-2xl",
          "flex flex-col overflow-hidden",
          // Mobile = slide-up/down,  Desktop = fade-in/out
          isExiting
            ? "slide-down md:fade-out"
            : "slide-up md:fade-in"
        )}
      >
        {/* Colour accent strip */}
        <div className="h-1 w-full shrink-0" style={{ backgroundColor: dotColor }} />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: dotColor }}
              >
                {isHub ? t("location.hub") : t("location.kiosk")}
              </span>
              {shown.verified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
              )}
            </div>
            <h2 className="heading text-base font-bold leading-tight text-foreground">
              {shown.name[lang]}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="shrink-0 p-1 rounded-lg hover:bg-muted transition-colors"
            aria-label={t("common.close")}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <Separator />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* Address */}
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{shown.address[lang]}</p>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {shown.description[lang]}
          </p>

          {/* Materials */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {t("location.materials")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {shown.materials.map((m) => (
                <MaterialBadge key={m} material={m} />
              ))}
            </div>
          </div>

          {/* Schedule */}
          {shown.schedule && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {t("location.schedule")}
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("location.weekdays")}:</span>
                  <span className="font-medium">{shown.schedule.weekdays}</span>
                </div>
                {shown.schedule.saturday && (
                  <div className="flex items-center gap-2 text-sm ml-5">
                    <span className="text-muted-foreground">{t("location.saturday")}:</span>
                    <span className="font-medium">{shown.schedule.saturday}</span>
                  </div>
                )}
                {shown.schedule.sunday ? (
                  <div className="flex items-center gap-2 text-sm ml-5">
                    <span className="text-muted-foreground">{t("location.sunday")}:</span>
                    <span className="font-medium">{shown.schedule.sunday}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm ml-5">
                    <span className="text-muted-foreground">{t("location.sunday")}:</span>
                    <span className="font-medium text-destructive">{t("location.closed")}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact */}
          {(shown.phone || shown.website) && (
            <div className="space-y-1.5">
              {shown.phone && (
                <a
                  href={`tel:${shown.phone}`}
                  className="flex items-center gap-2 text-sm text-accent hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {shown.phone}
                </a>
              )}
              {shown.website && (
                <a
                  href={shown.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-accent hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {t("common.openWebsite")}
                </a>
              )}
            </div>
          )}

          {/* Photos toggle */}
          <div>
            <button
              onClick={() => setPhotosOpen(!photosOpen)}
              disabled={!hasPhotos}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors",
                hasPhotos
                  ? "text-accent hover:text-accent/80"
                  : "text-muted-foreground cursor-not-allowed"
              )}
            >
              <ImageIcon className="w-4 h-4" />
              {t("location.photos")}
              {hasPhotos && (
                <>
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                    {shown.photos.length}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 transition-transform",
                      photosOpen && "rotate-180"
                    )}
                  />
                </>
              )}
              {!hasPhotos && (
                <span className="text-xs">({t("location.noPhotos")})</span>
              )}
            </button>

            {/* Photo gallery */}
            {photosOpen && hasPhotos && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {shown.photos.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={`${shown.name[lang]} — фото ${i + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-4 pb-4 pt-3 shrink-0 border-t border-border">
          <ButtonLink href={`/locations/${shown.slug}`} className="w-full" size="sm">
            {t("location.viewDetail")}
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
