"use client";

import { Plus, Minus, Locate } from "lucide-react";
import { useMap } from "react-leaflet";
import { useLang } from "@/context/LangContext";
import { ASTANA_CENTER, ASTANA_DEFAULT_ZOOM } from "@/lib/constants";
import { cn } from "@/lib/utils";

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

export function MapControls() {
  const map = useMap();
  const { t } = useLang();

  const handleLocate = () => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        map.flyTo([coords.latitude, coords.longitude], 15, { animate: true, duration: 1 });
      },
      () => {
        // Permission denied or error — silently fail
      }
    );
  };

  return (
    <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-1">
      <ControlButton
        onClick={() => map.zoomIn()}
        label={t("map.zoomIn")}
      >
        <Plus className="w-4 h-4" />
      </ControlButton>
      <ControlButton
        onClick={() => map.zoomOut()}
        label={t("map.zoomOut")}
      >
        <Minus className="w-4 h-4" />
      </ControlButton>
      <ControlButton
        onClick={handleLocate}
        label={t("map.myLocation")}
        className="mt-1 text-[#2EC4B6]"
      >
        <Locate className="w-4 h-4" />
      </ControlButton>
    </div>
  );
}

// Separate component to reset view — used in "no results" state
export function ResetViewControl() {
  const map = useMap();
  return (
    <button
      onClick={() => map.flyTo([ASTANA_CENTER.lat, ASTANA_CENTER.lng], ASTANA_DEFAULT_ZOOM)}
      className="text-xs text-[#2EC4B6] hover:underline mt-1"
    >
      Сбросить вид
    </button>
  );
}
