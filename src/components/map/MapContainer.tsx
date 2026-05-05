"use client";

// ────────────────────────────────────────────────────────────
//  WHY "use client"?
//  Leaflet reads window.document on import — it crashes on the
//  server. This component is always dynamic-imported with
//  { ssr: false } from the page, so it only ever runs in the
//  browser.
// ────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import { MapContainer as LeafletMapContainer, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "next-themes";

import { MapControls } from "@/components/map/MapControls";
import { LocationMarker } from "@/components/map/LocationMarker";
import { LocationDetailPanel } from "@/components/map/LocationDetailPanel";
import { FilterPanel } from "@/components/map/FilterPanel";
import { useLang } from "@/context/LangContext";
import { ASTANA_CENTER, ASTANA_DEFAULT_ZOOM, TILE_URL, TILE_URL_DARK } from "@/lib/constants";
import { getLocations } from "@/lib/api";
import type { Location, MaterialType, LocationCategory } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Fix Leaflet default marker icon paths broken by bundlers ─
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Tile switcher (reacts to theme changes without remounting map) ─
function TileLayerThemed() {
  const { resolvedTheme } = useTheme();
  const url = resolvedTheme === "dark" ? TILE_URL_DARK : TILE_URL;
  return (
    <TileLayer
      url={url}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      maxZoom={19}
    />
  );
}

// ── Click-on-map closes the detail panel ─────────────────────
function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
  const map = useMap();
  useEffect(() => {
    map.on("click", onMapClick);
    return () => { map.off("click", onMapClick); };
  }, [map, onMapClick]);
  return null;
}

// ────────────────────────────────────────────────────────────
//  Main component
// ────────────────────────────────────────────────────────────
export default function MapContainer() {
  const { t } = useLang();

  // Data
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | "all">("all");

  // UI state
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [filterOpen, setFilterOpen] = useState(false); // mobile filter drawer

  // Load locations (no filters on mount = show everything)
  useEffect(() => {
    setIsLoading(true);
    getLocations()
      .then(setLocations)
      .finally(() => setIsLoading(false));
  }, []);

  // Apply filters locally (already filtered in api.ts for mock mode)
  const filtered = locations.filter((loc) => {
    const materialMatch =
      selectedMaterials.length === 0 ||
      selectedMaterials.some((m) => loc.materials.includes(m));
    const categoryMatch =
      selectedCategory === "all" || loc.category === selectedCategory;
    return materialMatch && categoryMatch;
  });

  const handleMarkerClick = useCallback((loc: Location) => {
    setSelectedLocation(loc);
    setFilterOpen(false);
  }, []);

  const handleMapClick = useCallback(() => {
    setSelectedLocation(null);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-[300px] h-[200px] rounded-xl" />
          <p className="text-sm text-muted-foreground">{t("map.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex">
      {/* ── Desktop filter sidebar ─────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-background overflow-y-auto">
        <div className="p-4">
          <h2 className="heading text-sm font-bold text-foreground mb-4">
            {t("map.title")}
          </h2>
          <FilterPanel
            selectedMaterials={selectedMaterials}
            selectedCategory={selectedCategory}
            onMaterialsChange={setSelectedMaterials}
            onCategoryChange={setSelectedCategory}
          />
        </div>
        {/* Results count */}
        <div className="px-4 pb-4 mt-auto">
          <p className="text-xs text-muted-foreground">
            {filtered.length} пунктов
          </p>
        </div>
      </aside>

      {/* ── Map area ──────────────────────────────────────── */}
      <div className="relative flex-1 min-w-0">
        <LeafletMapContainer
          center={[ASTANA_CENTER.lat, ASTANA_CENTER.lng]}
          zoom={ASTANA_DEFAULT_ZOOM}
          className="w-full h-full"
          zoomControl={false}
          maxBoundsViscosity={0.8}
        >
          <TileLayerThemed />
          <MapControls />
          <MapClickHandler onMapClick={handleMapClick} />

          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={60}
            showCoverageOnHover={false}
          >
            {filtered.map((loc) => (
              <LocationMarker
                key={loc.id}
                location={loc}
                isSelected={selectedLocation?.id === loc.id}
                onClick={handleMarkerClick}
              />
            ))}
          </MarkerClusterGroup>
        </LeafletMapContainer>

        {/* No-results overlay */}
        {filtered.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-[999] pointer-events-none">
            <div className="bg-background/95 border border-border rounded-xl px-6 py-4 text-center shadow-xl pointer-events-auto">
              <p className="text-sm text-muted-foreground">{t("map.noResults")}</p>
              <button
                onClick={() => { setSelectedMaterials([]); setSelectedCategory("all"); }}
                className="text-xs text-[#2EC4B6] hover:underline mt-1 block mx-auto"
              >
                {t("map.filterClearAll")}
              </button>
            </div>
          </div>
        )}

        {/* Detail panel (inside map area so it can be positioned absolutely) */}
        <LocationDetailPanel
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />

        {/* ── Mobile FAB — filter ───────────────────────── */}
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={cn(
            "md:hidden absolute top-4 left-4 z-[1000]",
            "flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg",
            "bg-background/95 border border-border text-sm font-medium",
            filterOpen && "text-[#2EC4B6]"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Фильтр
          {selectedMaterials.length > 0 && (
            <span className="ml-1 bg-[#2EC4B6] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedMaterials.length}
            </span>
          )}
        </button>

        {/* Mobile filter drawer */}
        {filterOpen && (
          <>
            <div
              className="md:hidden absolute inset-0 z-[900] bg-black/30"
              onClick={() => setFilterOpen(false)}
            />
            <div className="md:hidden absolute bottom-0 left-0 right-0 z-[1000] bg-background rounded-t-2xl border-t border-border max-h-[70vh] overflow-y-auto slide-up">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h3 className="heading text-sm font-bold">Фильтры</h3>
                <button onClick={() => setFilterOpen(false)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="px-4 pb-8">
                <FilterPanel
                  selectedMaterials={selectedMaterials}
                  selectedCategory={selectedCategory}
                  onMaterialsChange={setSelectedMaterials}
                  onCategoryChange={setSelectedCategory}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
