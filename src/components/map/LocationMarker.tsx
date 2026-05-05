"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { MARKER_COLORS, MATERIALS } from "@/lib/constants";
import { useLang } from "@/context/LangContext";
import type { Location } from "@/types";
import { cn } from "@/lib/utils";

// ── Build a custom SVG pin icon ───────────────────────────────
function createPinIcon(color: string, isSelected: boolean): L.DivIcon {
  const size = isSelected ? 36 : 28;
  const svg = `
    <svg width="${size}" height="${size * 1.3}" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
        fill="${color}" stroke="white" stroke-width="${isSelected ? 2.5 : 1.5}"/>
      <circle cx="14" cy="13" r="5" fill="white" fill-opacity="0.9"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size * 1.3],
    iconAnchor: [size / 2, size * 1.3],
    popupAnchor: [0, -(size * 1.3)],
  });
}

interface LocationMarkerProps {
  location: Location;
  isSelected: boolean;
  onClick: (location: Location) => void;
}

export function LocationMarker({ location, isSelected, onClick }: LocationMarkerProps) {
  const { lang } = useLang();
  const color = location.category === "hub" ? MARKER_COLORS.hub : MARKER_COLORS.kiosk;
  const icon = createPinIcon(color, isSelected);

  return (
    <Marker
      position={[location.position.lat, location.position.lng]}
      icon={icon}
      eventHandlers={{
        click: (e) => {
          e.originalEvent.stopPropagation();
          onClick(location);
        },
      }}
      zIndexOffset={isSelected ? 1000 : 0}
    >
      {/* Leaflet Popup — lightweight hover/click label */}
      <Popup
        autoPan={false}
        closeButton={false}
        className="gr-popup"
        offset={[0, -28]}
      >
        <div className="px-2 py-1 text-xs font-semibold text-foreground min-w-max">
          {location.name[lang]}
        </div>
      </Popup>
    </Marker>
  );
}
