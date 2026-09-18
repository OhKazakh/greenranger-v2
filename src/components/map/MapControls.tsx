"use client";

import { Plus, Minus, Locate } from "lucide-react";
import type { RefObject } from "react";
import { useLang } from "@/context/LangContext";
import { cn } from "@/lib/utils";

interface MapControlsProps {
  map: RefObject<google.maps.Map | null>;
  locating: boolean;
  onLocate: () => void;
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
        "w-11 h-11 md:w-9 md:h-9 flex items-center justify-center rounded-lg",
        "bg-background/95 border border-border shadow-sm",
        "hover:bg-muted transition-colors text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

export function MapControls({ map, locating, onLocate }: MapControlsProps) {
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

  return (
    <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-1">
      <ControlButton onClick={zoomIn} label={t("map.zoomIn")}>
        <Plus className="w-4 h-4" />
      </ControlButton>
      <ControlButton onClick={zoomOut} label={t("map.zoomOut")}>
        <Minus className="w-4 h-4" />
      </ControlButton>
      <ControlButton
        onClick={onLocate}
        label={t("map.myLocation")}
        className={cn("mt-1", locating ? "text-muted-foreground animate-pulse" : "text-accent")}
      >
        <Locate className="w-4 h-4" />
      </ControlButton>
    </div>
  );
}
