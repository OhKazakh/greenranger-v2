import { MapPin, Clock, CheckCircle2, Navigation } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { MaterialBadge } from "@/components/shared/MaterialBadge";
import { useLang } from "@/context/LangContext";
import { MARKER_COLORS } from "@/lib/constants";
import { formatDistance } from "@/lib/geo";
import type { Location } from "@/types";
import { cn } from "@/lib/utils";

interface LocationCardProps {
  location: Location;
  compact?: boolean;
  /** Distance from the user in km — shows a badge when provided */
  distanceKm?: number | null;
}

export function LocationCard({ location, compact = false, distanceKm = null }: LocationCardProps) {
  const { lang, t } = useLang();
  const isHub = location.category === "hub";
  const dotColor = isHub ? MARKER_COLORS.hub : MARKER_COLORS.kiosk;

  const todaySchedule = location.schedule?.weekdays ?? null;

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Colour bar on top — matches pin colour */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: dotColor }}
        aria-hidden="true"
      />

      <CardContent className={cn("pt-4", compact ? "pb-3" : "pb-4")}>
        {/* Category tag + verified badge */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              isHub ? "text-primary" : "text-accent"
            )}
          >
            {isHub ? t("location.hub") : t("location.kiosk")}
          </span>
          <span className="flex items-center gap-2">
            {distanceKm != null && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                <Navigation className="w-3 h-3" />
                {formatDistance(distanceKm, lang)}
              </span>
            )}
            {location.verified && (
              <CheckCircle2
                className="w-4 h-4 text-accent"
                aria-label={t("location.verified")}
              />
            )}
          </span>
        </div>

        {/* Name */}
        <h3 className="heading text-base font-bold text-foreground leading-tight mb-1 group-hover:text-accent transition-colors">
          {location.name[lang]}
        </h3>

        {/* Address */}
        <p className="flex items-start gap-1 text-xs text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {location.address[lang]}
        </p>

        {/* Schedule (if available) */}
        {todaySchedule && !compact && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {t("location.weekdays")}: {todaySchedule}
          </p>
        )}

        {/* Material badges — show first 4, then +N */}
        <div className="flex flex-wrap gap-1">
          {location.materials.slice(0, compact ? 3 : 4).map((m) => (
            <MaterialBadge key={m} material={m} size="sm" />
          ))}
          {location.materials.length > (compact ? 3 : 4) && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              +{location.materials.length - (compact ? 3 : 4)}
            </span>
          )}
        </div>
      </CardContent>

      {!compact && (
        <CardFooter className="pt-0 pb-4">
          <ButtonLink href={`/locations/${location.slug}`} size="sm" className="w-full">
            {t("location.viewDetail")}
          </ButtonLink>
        </CardFooter>
      )}
    </Card>
  );
}
