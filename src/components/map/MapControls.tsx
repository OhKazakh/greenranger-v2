"use client";

import { Plus, Minus, Locate } from "lucide-react";
import type { RefObject } from "react";
import { useLang } from "@/context/LangContext";
import { cn } from "@/lib/utils";

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
    if (!map.current) return;
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        map.current!.panTo({ lat: coords.latitude, lng: coords.longitude });
        map.current!.setZoom(15);
      },
      () => {
        // permission denied — silently ignore
      }
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
        className="mt-1 text-accent"
      >
        <Locate className="w-4 h-4" />
      </ControlButton>
    </div>
  );
}
