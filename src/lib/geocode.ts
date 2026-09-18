import { ASTANA_BOUNDS } from "@/lib/constants";
import type { Lang, LatLng } from "@/types";

// OpenStreetMap's Nominatim: free, but its usage policy forbids
// search-as-you-type, so only call this on an explicit submit.
export async function geocodeAddress(query: string, lang: Lang): Promise<LatLng | null> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
    countrycodes: "kz",
    viewbox: `${ASTANA_BOUNDS.west},${ASTANA_BOUNDS.north},${ASTANA_BOUNDS.east},${ASTANA_BOUNDS.south}`,
    bounded: "1",
    "accept-language": lang,
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const results: { lat: string; lon: string }[] = await res.json();
  if (results.length === 0) return null;
  return { lat: Number(results[0].lat), lng: Number(results[0].lon) };
}
