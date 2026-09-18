import type { LatLng, Lang, Location } from "@/types";

// Great-circle distance between two points in kilometres (haversine).
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// "650 м" / "1.2 км" (en: "650 m" / "1.2 km")
export function formatDistance(km: number, lang: Lang): string {
  const [m, kmUnit] = lang === "en" ? ["m", "km"] : ["м", "км"];
  return km < 1 ? `${Math.round(km * 1000)} ${m}` : `${km.toFixed(1)} ${kmUnit}`;
}

export interface NearbyLocation {
  location: Location;
  distanceKm: number;
}

export function nearestTo(origin: LatLng, locations: Location[], count: number): NearbyLocation[] {
  return locations
    .map((location) => ({ location, distanceKm: haversineKm(origin, location.position) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, count);
}

export function directionsUrl(from: LatLng, to: LatLng): string {
  const params = new URLSearchParams({
    api: "1",
    origin: `${from.lat},${from.lng}`,
    destination: `${to.lat},${to.lng}`,
  });
  return `https://www.google.com/maps/dir/?${params}`;
}
