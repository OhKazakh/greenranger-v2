"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/types";

// Fix default icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MiniMapProps {
  position: LatLng;
  name: string;
}

export default function MiniMap({ position, name }: MiniMapProps) {
  return (
    <MapContainer
      center={[position.lat, position.lng]}
      zoom={15}
      className="w-full h-full"
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution=""
      />
      <Marker position={[position.lat, position.lng]}>
        <Popup>{name}</Popup>
      </Marker>
    </MapContainer>
  );
}
