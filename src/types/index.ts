// ────────────────────────────────────────────────────────────
//  GreenRanger v2 — Central Type Definitions
// ────────────────────────────────────────────────────────────

// ── Language ─────────────────────────────────────────────────
export type Lang = "ru" | "en" | "kk";

// ── Material types accepted at a recycling point ─────────────
export type MaterialType =
  | "plastic"
  | "paper"
  | "glass"
  | "metal"
  | "aluminium"
  | "bottles"
  | "clothes"
  | "electronics"
  | "batteries"
  | "industrial";

// ── Category: big hub vs small public kiosk ──────────────────
export type LocationCategory = "hub" | "kiosk";

// ── Geographic coordinates ────────────────────────────────────
export interface LatLng {
  lat: number;
  lng: number;
}

// ── Translated string in all 3 locales ───────────────────────
export interface I18nString {
  ru: string;
  en: string;
  kk: string;
}

// ── Working schedule ─────────────────────────────────────────
export interface Schedule {
  weekdays: string; // e.g. "09:00–18:00"
  saturday: string | null;
  sunday: string | null;
}

// ── A recycling location ──────────────────────────────────────
export interface Location {
  id: string;
  slug: string;                  // URL-friendly id, e.g. "kazrecycle-service"
  category: LocationCategory;
  name: I18nString;
  description: I18nString;
  address: I18nString;
  position: LatLng;
  materials: MaterialType[];
  schedule: Schedule | null;
  phone: string | null;
  website: string | null;
  photos: string[];              // array of image URLs (empty = no photos)
  verified: boolean;             // manually confirmed as active
  createdAt: string;             // ISO date string
}

// ── User (from JWT payload decoded on frontend) ───────────────
export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

// ── Auth state stored in context ─────────────────────────────
export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

// ── Submit form payload (new location suggestion) ─────────────
export interface SubmitLocationPayload {
  name: string;
  address: string;
  lat: number;
  lng: number;
  materials: MaterialType[];
  description: string;
  phone?: string;
  website?: string;
}

// ── API response wrapper ──────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
}

// ── Filter state (used on map + list pages) ───────────────────
export interface FilterState {
  materials: MaterialType[];       // empty = show all
  category: LocationCategory | "all";
  search: string;
}

// ── Review ────────────────────────────────────────────────────
export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string };
}

export interface ReviewsResponse {
  reviews: Review[];
  avgRating: number | null;
  count: number;
}

// ── Material metadata (display name + colour + icon) ─────────
export interface MaterialMeta {
  id: MaterialType;
  label: I18nString;
  color: string;   // Tailwind bg class
  icon: string;    // emoji fallback
}
