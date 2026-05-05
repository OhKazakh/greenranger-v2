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
export const MARKER_COLORS = {
  hub: "#1B4332",    // forest green
  kiosk: "#2EC4B6",  // teal
  user: "#3B82F6",   // blue
} as const;

// ── Tile layer URL (CartoDB Positron — clean & muted) ─────────
export const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// ── Dark tile layer ───────────────────────────────────────────
export const TILE_URL_DARK =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
