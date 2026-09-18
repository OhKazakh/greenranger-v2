"use client";

import { useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { useTheme } from "next-themes";
import { MAP_STYLE_LIGHT, MAP_STYLE_DARK } from "@/lib/constants";
import { pinIconUrl, pinSize } from "@/lib/pins";
import type { LatLng, LocationCategory } from "@/types";

interface MiniMapProps {
  position: LatLng;
  name: string;
  category: LocationCategory;
}

const LIBRARIES: ("places")[] = [];

export default function MiniMap({ position, name, category }: MiniMapProps) {
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

  const size = pinSize(false);

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
          url: pinIconUrl(category, { dark: resolvedTheme === "dark" }),
          scaledSize: new google.maps.Size(size.width, size.height),
          anchor: new google.maps.Point(size.anchorX, size.anchorY),
        }}
      />
    </GoogleMap>
  );
}
