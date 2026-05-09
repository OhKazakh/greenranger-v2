"use client";

import { Plus, Minus, Locate } from "lucide-react";
import { useState } from "react";
import type { RefObject } from "react";
import { useLang } from "@/context/LangContext";
import { cn } from "@/lib/utils";
import { MARKER_COLORS } from "@/lib/constants";

interface MapControlsProps {
  map: RefObject<google.maps.Map | null>;
}

function ControlButton({
  onClick,
  label,
  children,
  className,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "w-9 h-9 flex items-center justify-center rounded-lg",
        "bg-background/95 border border-border shadow-sm",
        "hover:bg-muted transition-colors text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

export function MapControls({ map }: MapControlsProps) {
  const { t } = useLang();
  const [locating, setLocating] = useState(false);
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);

  const zoomIn = () => {
    const m = map.current;
    if (!m) return;
    m.setZoom((m.getZoom() ?? 12) + 1);
  };
  const zoomOut = () => {
    const m = map.current;
    if (!m) return;
    m.setZoom((m.getZoom() ?? 12) - 1);
  };

  const handleLocate = () => {
    if (!map.current || locating) return;

    if (!navigator.geolocation) return;

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        map.current!.panTo(pos);
        map.current!.setZoom(15);

        // Remove previous user marker
        userMarker?.setMap(null);

        const marker = new google.maps.Marker({
          position: pos,
          map: map.current!,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: MARKER_COLORS.user,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2.5,
          },
          title: "My location",
          zIndex: 999,
        });

        setUserMarker(marker);
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-1">
      <ControlButton onClick={zoomIn} label={t("map.zoomIn")}>
        <Plus className="w-4 h-4" />
      </ControlButton>
      <ControlButton onClick={zoomOut} label={t("map.zoomOut")}>
        <Minus className="w-4 h-4" />
      </ControlButton>
      <ControlButton
        onClick={handleLocate}
        label={t("map.myLocation")}
        className={cn("mt-1", locating ? "text-muted-foreground animate-pulse" : "text-accent")}
      >
        <Locate className="w-4 h-4" />
      </ControlButton>
    </div>
  );
}
