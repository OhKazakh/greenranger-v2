"use client";

import { useState } from "react";
import { Locate, MousePointerClick, Navigation, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/context/LangContext";
import { geocodeAddress } from "@/lib/geocode";
import { directionsUrl, formatDistance, type NearbyLocation } from "@/lib/geo";
import { openStatus, todaysHours } from "@/lib/hours";
import { cn } from "@/lib/utils";
import type { LatLng, Location } from "@/types";

const STATUS_STYLES = {
  open: "bg-accent/10 text-accent",
  closed: "bg-destructive/10 text-destructive",
  unknown: "bg-muted text-muted-foreground",
} as const;

interface NearestPanelProps {
  origin: LatLng | null;
  nearest: NearbyLocation[];
  locating: boolean;
  picking: boolean;
  onOrigin: (pos: LatLng) => void;
  onLocate: () => void;
  onTogglePick: () => void;
  onClear: () => void;
  onSelect: (location: Location) => void;
}

export function NearestPanel({
  origin,
  nearest,
  locating,
  picking,
  onOrigin,
  onLocate,
  onTogglePick,
  onClear,
  onSelect,
}: NearestPanelProps) {
  const { t, lang } = useLang();
  const [address, setAddress] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = address.trim();
    if (!query || searching) return;

    setSearching(true);
    try {
      const found = await geocodeAddress(query, lang);
      if (found) onOrigin(found);
      else toast.error(t("nearest.notFound"));
    } catch {
      toast.error(t("nearest.searchFailed"));
    } finally {
      setSearching(false);
    }
  };

  const now = new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          {t("nearest.title")}
        </p>
        {origin && (
          <button
            onClick={onClear}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
          >
            <X className="w-3 h-3" />
            {t("actions.clear")}
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="relative">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t("nearest.addressPlaceholder")}
          className="w-full text-[12.5px] bg-background border border-border rounded-lg pl-2.5 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={searching}
          aria-label={t("nearest.search")}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <Search className={cn("w-3.5 h-3.5", searching && "animate-pulse")} />
        </button>
      </form>
      <p className="text-[10px] text-muted-foreground/70 mt-1">{t("nearest.attribution")}</p>

      <div className="flex flex-col gap-1.5 mt-2">
        <button
          onClick={onLocate}
          disabled={locating}
          className="flex-1 flex items-center justify-center gap-1.5 text-[12px] px-2 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-60"
        >
          <Locate className={cn("w-3.5 h-3.5", locating && "animate-pulse")} />
          {t("map.myLocation")}
        </button>
        <button
          onClick={onTogglePick}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 text-[12px] px-2 py-1.5 rounded-lg border transition-colors",
            picking
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <MousePointerClick className="w-3.5 h-3.5" />
          {t("nearest.pickOnMap")}
        </button>
      </div>

      {picking && <p className="text-[11.5px] text-accent mt-2">{t("nearest.pickHint")}</p>}

      {!origin && !picking && (
        <p className="text-[11.5px] text-muted-foreground mt-2 leading-relaxed">{t("nearest.hint")}</p>
      )}

      {origin && nearest.length === 0 && (
        <p className="text-[11.5px] text-muted-foreground mt-2">{t("map.noResults")}</p>
      )}

      {origin && nearest.length > 0 && (
        <ol className="flex flex-col gap-1.5 mt-3">
          {nearest.map(({ location, distanceKm }, i) => {
            const status = openStatus(location.schedule, now);
            const hours = todaysHours(location.schedule, now);
            return (
              <li key={location.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(location)}
                  onKeyDown={(e) => e.key === "Enter" && onSelect(location)}
                  className="rounded-lg border border-border p-2.5 hover:border-accent/40 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-foreground leading-snug">
                        {i + 1}. {location.name[lang]}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1.5">
                        <span className={cn("text-[10.5px] font-medium px-1.5 py-0.5 rounded", STATUS_STYLES[status])}>
                          {t(`nearest.${status}`)}
                        </span>
                        {hours && <span className="text-[10.5px] text-muted-foreground">{hours}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[12px] font-semibold text-accent">
                        {formatDistance(distanceKm, lang)}
                      </span>
                      <a
                        href={directionsUrl(origin, location.position)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-accent"
                      >
                        <Navigation className="w-3 h-3" />
                        {t("nearest.directions")}
                      </a>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
