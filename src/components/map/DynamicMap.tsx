"use client";

// ────────────────────────────────────────────────────────────
//  DynamicMap — Client Component wrapper for the Leaflet map.
//
//  WHY THIS FILE EXISTS:
//  Next.js 16 / Turbopack forbids `ssr: false` in Server
//  Components. The solution is to wrap the dynamic import
//  inside a "use client" component, then use *that* component
//  from the (server) page.
// ────────────────────────────────────────────────────────────

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const MapContainer = dynamic(
  () => import("@/components/map/MapContainer"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-[280px] h-[180px] rounded-xl" />
          <Skeleton className="w-32 h-4 rounded" />
        </div>
      </div>
    ),
  }
);

export function DynamicMap() {
  return <MapContainer />;
}
