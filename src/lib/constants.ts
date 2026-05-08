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
// Aligned with the new "bold civic" palette.
export const MARKER_COLORS = {
  hub: "#0A2540",       // deep navy — large recycling centres
  kiosk: "#0070F3",     // electric blue — kiosks / RVMs
  user: "#22C55E",      // green — user position (only place we use green)
  cluster: "#0070F3",   // electric blue — cluster bubble
  clusterRing: "#0A2540", // navy — ring around cluster
} as const;

// ── Google Maps style (light) ─────────────────────────────────
// Strategy: hide ALL labels by default at the top, then explicitly
// re-enable ONLY road labels. This way no future Google update can
// surprise us with new label types (parks, neighbourhoods, etc.).
export const MAP_STYLE_LIGHT: google.maps.MapTypeStyle[] = [
  // Base geometry colour
  { elementType: "geometry", stylers: [{ color: "#f5f5f7" }] },

  // Nuke ALL labels everywhere
  { elementType: "labels", stylers: [{ visibility: "off" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },

  // Hide every "place of interest" entirely (icons + geometry + labels)
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  // Hide all administrative boundaries' labels (districts, neighbourhoods, country, etc.)
  { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  // Hide transit (subway lines, bus stops)
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  // Hide water labels (lake/river names)
  { featureType: "water", elementType: "labels", stylers: [{ visibility: "off" }] },
  // Hide landscape labels (mountain names etc.)
  { featureType: "landscape", elementType: "labels", stylers: [{ visibility: "off" }] },

  // ── Now bring road labels BACK ──
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#5b6470" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f7" }] },

  // Geometry styling for roads (visual)
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ffffff" }] },

  // Water + park geometry colours (no labels though)
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cfe2f3" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e8efe6" }] },
];

// ── Google Maps style (dark) ──────────────────────────────────
// Same strategy — hide all labels, re-enable only road labels.
export const MAP_STYLE_DARK: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0b0d12" }] },

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
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8b94a3" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#0b0d12" }] },

  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1c2030" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#222a3d" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a1828" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#14201a" }] },
];
