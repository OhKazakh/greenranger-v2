import type {
  Location,
  SubmitLocationPayload,
  User,
  FilterState,
  Review,
  ReviewsResponse,
} from "@/types";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001") + "/api";

// Generous, because a sleeping free-tier backend can take ~50s to wake.
// Without it a stalled server leaves the UI spinning forever instead of
// showing the retry button.
const REQUEST_TIMEOUT_MS = 60_000;

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      credentials: "include", // sends httpOnly JWT cookie automatically
      signal: options?.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new Error("Request timed out");
    }
    throw err;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

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

export async function getLocations(filter?: Partial<FilterState>): Promise<Location[]> {
  const params = new URLSearchParams();
  if (filter?.materials?.length) params.set("materials", filter.materials.join(","));
  if (filter?.category && filter.category !== "all") params.set("category", filter.category);
  if (filter?.search) params.set("search", filter.search);

  const raw = await apiFetch<unknown[]>(`/locations?${params.toString()}`);
  return raw.map(toLocation);
}

export async function getLocationBySlug(slug: string): Promise<Location | null> {
  const raw = await apiFetch<unknown>(`/locations/${slug}`);
  return toLocation(raw);
}

export async function getLocationById(id: string): Promise<Location | null> {
  const raw = await apiFetch<unknown>(`/locations/id/${id}`);
  return toLocation(raw);
}

export async function submitLocation(payload: SubmitLocationPayload): Promise<void> {
  await apiFetch("/locations/suggest", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getReviews(slug: string): Promise<ReviewsResponse> {
  return apiFetch<ReviewsResponse>(`/locations/${slug}/reviews`);
}

export async function submitReview(
  slug: string,
  payload: { rating: number; comment?: string }
): Promise<Review> {
  return apiFetch<Review>(`/locations/${slug}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteReview(slug: string): Promise<void> {
  await apiFetch(`/locations/${slug}/reviews`, { method: "DELETE" });
}

interface RawLocalized {
  slug: string;
  nameRu: string;
  nameEn: string;
  nameKk: string;
}

export interface MyReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  location: RawLocalized & { verified: boolean };
}

export interface MySubmission {
  id: string;
  slug: string;
  nameRu: string;
  nameEn: string;
  nameKk: string;
  category: string;
  verified: boolean;
  createdAt: string;
}

export interface MyActivity {
  reviews: MyReview[];
  submissions: MySubmission[];
}

export async function getMyActivity(): Promise<MyActivity> {
  return apiFetch<MyActivity>("/users/me/activity");
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { reviews: number; submissions: number };
}

export async function adminGetUsers(): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>("/users");
}

export async function adminGetAllLocations(): Promise<Location[]> {
  const raws = await apiFetch<unknown[]>("/locations/admin/all");
  return raws.map(toLocation);
}

export async function adminSetVerified(id: string, verified: boolean): Promise<void> {
  await apiFetch(`/locations/${id}/verify`, {
    method: "PATCH",
    body: JSON.stringify({ verified }),
  });
}

export async function adminDeleteLocation(id: string): Promise<void> {
  await apiFetch(`/locations/${id}`, { method: "DELETE" });
}

export interface AdminLocationUpdate {
  category?: "hub" | "kiosk";
  nameRu?: string;
  nameEn?: string;
  nameKk?: string;
  descriptionRu?: string;
  descriptionEn?: string;
  descriptionKk?: string;
  addressRu?: string;
  addressEn?: string;
  addressKk?: string;
  lat?: number;
  lng?: number;
  materials?: string[];
  phone?: string;
  website?: string;
  photos?: string[];
}

export async function adminUpdateLocation(
  id: string,
  patch: AdminLocationUpdate
): Promise<Location> {
  const raw = await apiFetch<unknown>(`/locations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return toLocation(raw);
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

// The server sets the httpOnly cookie; the returned user updates the UI right away.
export async function login(payload: LoginPayload): Promise<User> {
  const res = await apiFetch<{ user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.user;
}

export async function register(payload: RegisterPayload): Promise<User> {
  const res = await apiFetch<{ user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.user;
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}

// Verifies the auth cookie with the server; null when logged out.
export async function getMe(): Promise<User | null> {
  try {
    return await apiFetch<User>("/auth/me");
  } catch {
    return null;
  }
}
