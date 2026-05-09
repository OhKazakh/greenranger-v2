// ────────────────────────────────────────────────────────────
//  GreenRanger v2 — Centralised API Client
//
//  HOW IT WORKS:
//  ┌─ NEXT_PUBLIC_USE_MOCK=true  → returns mock data immediately (no network)
//  └─ NEXT_PUBLIC_USE_MOCK=false → calls the real NestJS backend
//
//  When the backend is ready:
//   1. Set NEXT_PUBLIC_USE_MOCK=false in .env.local
//   2. Set NEXT_PUBLIC_API_URL=https://api.greenranger.kz
//   3. Zero component code changes needed.
// ────────────────────────────────────────────────────────────

import type {
  Location,
  SubmitLocationPayload,
  User,
  FilterState,
  Review,
  ReviewsResponse,
} from "@/types";
import { mockLocations } from "@/lib/mock-data";

// ── Config ────────────────────────────────────────────────────
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false"; // default = mock ON
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001") + "/api";

// ── Small delay to simulate real network latency in mock mode ─
const mockDelay = (ms = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ── Base fetcher (used in real mode only) ────────────────────
async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include", // sends httpOnly JWT cookie automatically
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ════════════════════════════════════════════════════════════
//  SHAPE TRANSFORM — backend flat → frontend nested
// ════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toLocation(r: any): Location {
  return {
    id: r.id,
    slug: r.slug,
    category: r.category,
    verified: r.verified,
    name: { ru: r.nameRu, en: r.nameEn, kk: r.nameKk },
    description: { ru: r.descriptionRu, en: r.descriptionEn, kk: r.descriptionKk },
    address: { ru: r.addressRu, en: r.addressEn, kk: r.addressKk },
    position: { lat: r.lat, lng: r.lng },
    materials: r.materials,
    schedule: {
      weekdays: r.scheduleWeekdays ?? null,
      saturday: r.scheduleSaturday ?? null,
      sunday: r.scheduleSunday ?? null,
    },
    phone: r.phone ?? null,
    website: r.website ?? null,
    photos: r.photos ?? [],
    createdAt: r.createdAt,
  };
}

// ════════════════════════════════════════════════════════════
//  LOCATIONS
// ════════════════════════════════════════════════════════════

/** Fetch all locations (optionally filtered server-side) */
export async function getLocations(filter?: Partial<FilterState>): Promise<Location[]> {
  if (USE_MOCK) {
    await mockDelay();
    let results = [...mockLocations];

    // Apply filter locally (same logic the server would run)
    if (filter?.materials && filter.materials.length > 0) {
      results = results.filter((loc) =>
        filter.materials!.some((m) => loc.materials.includes(m))
      );
    }
    if (filter?.category && filter.category !== "all") {
      results = results.filter((loc) => loc.category === filter.category);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (loc) =>
          loc.name.ru.toLowerCase().includes(q) ||
          loc.name.en.toLowerCase().includes(q) ||
          loc.address.ru.toLowerCase().includes(q)
      );
    }

    return results;
  }

  // Build query string from filter
  const params = new URLSearchParams();
  if (filter?.materials?.length) params.set("materials", filter.materials.join(","));
  if (filter?.category && filter.category !== "all") params.set("category", filter.category);
  if (filter?.search) params.set("search", filter.search);

  const raw = await apiFetch<unknown[]>(`/locations?${params.toString()}`);
  return raw.map(toLocation);
}

/** Fetch a single location by slug */
export async function getLocationBySlug(slug: string): Promise<Location | null> {
  if (USE_MOCK) {
    await mockDelay(150);
    return mockLocations.find((l) => l.slug === slug) ?? null;
  }
  const raw = await apiFetch<unknown>(`/locations/${slug}`);
  return toLocation(raw);
}

/** Fetch a single location by id */
export async function getLocationById(id: string): Promise<Location | null> {
  if (USE_MOCK) {
    await mockDelay(150);
    return mockLocations.find((l) => l.id === id) ?? null;
  }
  const raw = await apiFetch<unknown>(`/locations/id/${id}`);
  return toLocation(raw);
}

/** Submit a new location suggestion (requires auth) */
export async function submitLocation(payload: SubmitLocationPayload): Promise<void> {
  if (USE_MOCK) {
    await mockDelay(600);
    console.log("[MOCK] submitLocation", payload);
    return;
  }
  await apiFetch("/locations/suggest", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ════════════════════════════════════════════════════════════
//  REVIEWS
// ════════════════════════════════════════════════════════════

export async function getReviews(slug: string): Promise<ReviewsResponse> {
  if (USE_MOCK) {
    return { reviews: [], avgRating: null, count: 0 };
  }
  return apiFetch<ReviewsResponse>(`/locations/${slug}/reviews`);
}

export async function submitReview(
  slug: string,
  payload: { rating: number; comment?: string }
): Promise<Review> {
  if (USE_MOCK) {
    throw new Error("Not available in mock mode");
  }
  return apiFetch<Review>(`/locations/${slug}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteReview(slug: string): Promise<void> {
  if (USE_MOCK) return;
  await apiFetch(`/locations/${slug}/reviews`, { method: "DELETE" });
}

// ════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

/**
 * Login — on success the server sets an httpOnly cookie.
 * We return the user object so the UI can update immediately.
 */
export async function login(payload: LoginPayload): Promise<User> {
  if (USE_MOCK) {
    await mockDelay(800);
    // Simulate a successful login
    if (payload.email && payload.password.length >= 6) {
      const mockUser: User = {
        id: "mock-user-1",
        email: payload.email,
        name: payload.email.split("@")[0],
        role: "user",
      };
      // Store in sessionStorage for mock persistence across page reloads
      sessionStorage.setItem("mock_user", JSON.stringify(mockUser));
      return mockUser;
    }
    throw new Error("Неверный email или пароль");
  }
  const res = await apiFetch<{ user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.user;
}

export async function register(payload: RegisterPayload): Promise<User> {
  if (USE_MOCK) {
    await mockDelay(800);
    const mockUser: User = {
      id: "mock-user-" + Date.now(),
      email: payload.email,
      name: payload.name,
      role: "user",
    };
    sessionStorage.setItem("mock_user", JSON.stringify(mockUser));
    return mockUser;
  }
  const res = await apiFetch<{ user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.user;
}

export async function logout(): Promise<void> {
  if (USE_MOCK) {
    sessionStorage.removeItem("mock_user");
    return;
  }
  await apiFetch("/auth/logout", { method: "POST" });
}

/**
 * Get the currently logged-in user.
 * In real mode: verifies the cookie with the server.
 * In mock mode: reads sessionStorage.
 */
export async function getMe(): Promise<User | null> {
  if (USE_MOCK) {
    const raw = sessionStorage.getItem("mock_user");
    return raw ? (JSON.parse(raw) as User) : null;
  }
  try {
    return await apiFetch<User>("/auth/me");
  } catch {
    return null;
  }
}
