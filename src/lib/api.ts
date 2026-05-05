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
} from "@/types";
import { mockLocations } from "@/lib/mock-data";

// ── Config ────────────────────────────────────────────────────
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false"; // default = mock ON
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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

  return apiFetch<Location[]>(`/locations?${params.toString()}`);
}

/** Fetch a single location by slug */
export async function getLocationBySlug(slug: string): Promise<Location | null> {
  if (USE_MOCK) {
    await mockDelay(150);
    return mockLocations.find((l) => l.slug === slug) ?? null;
  }
  return apiFetch<Location>(`/locations/${slug}`);
}

/** Fetch a single location by id */
export async function getLocationById(id: string): Promise<Location | null> {
  if (USE_MOCK) {
    await mockDelay(150);
    return mockLocations.find((l) => l.id === id) ?? null;
  }
  return apiFetch<Location>(`/locations/id/${id}`);
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
  return apiFetch<User>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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
  return apiFetch<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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
