import type { MaterialMeta, MaterialType } from "@/types";

// ── Astana map defaults ───────────────────────────────────────
export const ASTANA_CENTER = { lat: 51.1282, lng: 71.4306 } as const;
export const ASTANA_DEFAULT_ZOOM = 12;
export const ASTANA_BOUNDS = {
  north: 51.32,
  south: 50.95,
  east: 71.65,
  west: 71.15,
} as const;

// ── Material display metadata ─────────────────────────────────
// color = Tailwind bg-* class used for badges
export const MATERIALS: Record<MaterialType, MaterialMeta> = {
  plastic: {
    id: "plastic",
    label: { ru: "Пластик", en: "Plastic", kk: "Пластик" },
    color: "bg-blue-500",
    icon: "♳",
  },
  paper: {
    id: "paper",
    label: { ru: "Бумага", en: "Paper", kk: "Қағаз" },
    color: "bg-yellow-500",
    icon: "📄",
  },
  glass: {
    id: "glass",
    label: { ru: "Стекло", en: "Glass", kk: "Шыны" },
    color: "bg-cyan-500",
    icon: "🫙",
  },
  metal: {
    id: "metal",
    label: { ru: "Металл", en: "Metal", kk: "Металл" },
    color: "bg-gray-500",
    icon: "⚙️",
  },
  aluminium: {
    id: "aluminium",
    label: { ru: "Алюминий", en: "Aluminium", kk: "Алюминий" },
    color: "bg-slate-400",
    icon: "🥫",
  },
  bottles: {
    id: "bottles",
    label: { ru: "Бутылки", en: "Bottles", kk: "Бөтелкелер" },
    color: "bg-emerald-500",
    icon: "🍾",
  },
  clothes: {
    id: "clothes",
    label: { ru: "Одежда", en: "Clothes", kk: "Киім" },
    color: "bg-purple-500",
    icon: "👕",
  },
  electronics: {
    id: "electronics",
    label: { ru: "Электроника", en: "Electronics", kk: "Электроника" },
    color: "bg-orange-500",
    icon: "📱",
  },
  batteries: {
    id: "batteries",
    label: { ru: "Батарейки", en: "Batteries", kk: "Батареялар" },
    color: "bg-red-500",
    icon: "🔋",
  },
  industrial: {
    id: "industrial",
    label: { ru: "Пром. отходы", en: "Industrial", kk: "Өнеркәсіп қалдықтары" },
    color: "bg-zinc-600",
    icon: "🏭",
  },
};

export const ALL_MATERIALS = Object.keys(MATERIALS) as MaterialType[];

// ── Marker colours by category ────────────────────────────────
// v1 eco-green palette.
export const MARKER_COLORS = {
  hub: "#1B4332",       // forest green — large recycling centres
  kiosk: "#2EC4B6",     // teal — kiosks / RVMs
  user: "#22C55E",      // bright green — user position
  cluster: "#2EC4B6",   // teal — cluster bubble
  clusterRing: "#1B4332", // forest green — ring around cluster
} as const;

// ── Google Maps style (light) ─────────────────────────────────
// Warm off-white base matching #fafaf5, muted greens for parks.
export const MAP_STYLE_LIGHT: google.maps.MapTypeStyle[] = [
  // Base geometry colour
  { elementType: "geometry", stylers: [{ color: "#f5f0e8" }] },

  // Nuke ALL labels everywhere
  { elementType: "labels", stylers: [{ visibility: "off" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },

  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", elementType: "labels", stylers: [{ visibility: "off" }] },

  // Road labels back on
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#5a6b5e" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#f5f0e8" }] },

  // Geometry
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#fdf8ed" }] },

  // Water + park — eco-tinted
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#b8d8e8" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d4e8d0" }] },
];

// ── Google Maps style (dark) ──────────────────────────────────
// Deep charcoal base matching #1a1a2e, forest-green tinted roads/parks.
export const MAP_STYLE_DARK: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },

  { elementType: "labels", stylers: [{ visibility: "off" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },

  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", elementType: "labels", stylers: [{ visibility: "off" }] },

  // Road labels back on
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8ba090" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },

  { featureType: "road", elementType: "geometry", stylers: [{ color: "#252540" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2a2a45" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1e2a" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#142218" }] },
];
