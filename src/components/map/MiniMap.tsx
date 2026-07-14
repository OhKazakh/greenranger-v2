"use client";

import { useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { useTheme } from "next-themes";
import { MAP_STYLE_LIGHT, MAP_STYLE_DARK, MARKER_COLORS } from "@/lib/constants";
import type { LatLng } from "@/types";

interface MiniMapProps {
  position: LatLng;
  name: string;
}

const LIBRARIES: ("places")[] = [];

export default function MiniMap({ position, name }: MiniMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: LIBRARIES,
  });
  const { resolvedTheme } = useTheme();
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // next-themes resolves the theme only after hydration — re-apply the style
  // to the live map instance so it doesn't get stuck on the wrong one.
  useEffect(() => {
    mapInstance?.setOptions({
      styles: resolvedTheme === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT,
    });
  }, [mapInstance, resolvedTheme]);

  if (!isLoaded) {
    return <div className="w-full h-full bg-muted" />;
  }

  // Padded viewBox so the white stroke isn't clipped at the edges.
  const pinSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 32 40">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
        fill="${MARKER_COLORS.kiosk}" stroke="white" stroke-width="2"/>
      <circle cx="14" cy="13" r="5" fill="white" fill-opacity="0.95"/>
    </svg>
  `;

  return (
    <GoogleMap
      mapContainerClassName="w-full h-full"
      center={{ lat: position.lat, lng: position.lng }}
      zoom={15}
      options={{
        disableDefaultUI: true,
        zoomControl: false,
        gestureHandling: "none",
        clickableIcons: false,
        styles: resolvedTheme === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT,
      }}
      onLoad={setMapInstance}
    >
      <Marker
        position={{ lat: position.lat, lng: position.lng }}
        title={name}
        icon={{
          // Aspect 32:40 = 0.8, so 32×40 keeps the SVG undistorted.
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(pinSvg),
          scaledSize: new google.maps.Size(32, 40),
          // Tip at viewBox (14, 36) → (0.5×W, 0.95×H) → (16, 38)
          anchor: new google.maps.Point(16, 38),
        }}
      />
    </GoogleMap>
  );
}
