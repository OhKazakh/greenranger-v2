"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { GoogleMap, useJsApiLoader, Marker, MarkerClusterer, OverlayView } from "@react-google-maps/api";
import { useTheme } from "next-themes";
import { SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";

import { LocationDetailPanel } from "@/components/map/LocationDetailPanel";
import { FilterPanel } from "@/components/map/FilterPanel";
import { MapControls } from "@/components/map/MapControls";
import { NearestPanel } from "@/components/map/NearestPanel";
import { useLang } from "@/context/LangContext";
import {
  ASTANA_CENTER,
  ASTANA_DEFAULT_ZOOM,
  ASTANA_BOUNDS,
  MARKER_COLORS,
  MAP_STYLE_LIGHT,
  MAP_STYLE_DARK,
  ALL_MATERIALS,
} from "@/lib/constants";
import { getLocations } from "@/lib/api";
import { nearestTo } from "@/lib/geo";
import type { LatLng, Location, MaterialType, LocationCategory } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// viewBox is padded by 2px so the white stroke isn't clipped at the edges.
function pinSvg(color: string, isSelected: boolean): string {
  const stroke = isSelected ? 3 : 2;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 32 40">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
        fill="${color}" stroke="white" stroke-width="${stroke}"/>
      <circle cx="14" cy="13" r="5" fill="white" fill-opacity="0.95"/>
    </svg>
  `;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

// Visual only — MarkerClusterer draws the count on top via its text styling.
function clusterIconUrl(): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 60 60">
      <circle cx="30" cy="30" r="28" fill="${MARKER_COLORS.cluster}" fill-opacity="0.18"/>
      <circle cx="30" cy="30" r="22" fill="${MARKER_COLORS.cluster}"/>
      <circle cx="30" cy="30" r="22" fill="none" stroke="white" stroke-width="2.5"/>
    </svg>
  `;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

const LIBRARIES: ("places")[] = [];
const NEAREST_COUNT = 3;

function insideAstana({ lat, lng }: LatLng): boolean {
  return (
    lat >= ASTANA_BOUNDS.south && lat <= ASTANA_BOUNDS.north &&
    lng >= ASTANA_BOUNDS.west && lng <= ASTANA_BOUNDS.east
  );
}


export default function MapContainer() {
  const { t, lang } = useLang();
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: LIBRARIES,
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  // Held in state (not just the ref) so the theme-style effect below
  // re-runs once the map instance actually exists.
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // Filter state — initialized from URL query params (?category=hub&materials=plastic,paper)
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialType[]>(() => {
    const raw = searchParams.get("materials");
    if (!raw) return [];
    return raw
      .split(",")
      .filter((m): m is MaterialType => (ALL_MATERIALS as readonly string[]).includes(m));
  });
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | "all">(() => {
    const c = searchParams.get("category");
    return c === "hub" || c === "kiosk" ? c : "all";
  });

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [picking, setPicking] = useState(false);
  const [locating, setLocating] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  // Stable reference — never changes, so GoogleMap never re-applies center on re-render
  const initialCenter = useMemo(() => ({ lat: ASTANA_CENTER.lat, lng: ASTANA_CENTER.lng }), []);

  // Fetch once on mount (retryable on failure)
  const loadData = useCallback(() => {
    setIsLoadingData(true);
    setLoadFailed(false);
    getLocations()
      .then(setLocations)
      .catch(() => setLoadFailed(true))
      .finally(() => setIsLoadingData(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // next-themes resolves the theme only after hydration, so the map can be
  // created with the wrong style. Re-apply styles whenever the theme (or the
  // map instance) changes — the options prop alone doesn't cover this race.
  useEffect(() => {
    mapInstance?.setOptions({
      styles: resolvedTheme === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT,
    });
  }, [mapInstance, resolvedTheme]);

  // If ?focus=<slug> is in the URL, pan to that location and open its panel
  // once both the map SDK and data are ready.
  useEffect(() => {
    const slug = searchParams.get("focus");
    if (!slug || !isLoaded || isLoadingData || locations.length === 0) return;

    const target = locations.find((l) => l.slug === slug);
    if (!target) return;

    setSelectedLocation(target);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: target.position.lat, lng: target.position.lng });
      mapRef.current.setZoom(16);
    }
  }, [searchParams, isLoaded, isLoadingData, locations]);

  const filtered = useMemo(() => {
    return locations.filter((loc) => {
      const materialMatch =
        selectedMaterials.length === 0 ||
        selectedMaterials.some((m) => loc.materials.includes(m));
      const categoryMatch =
        selectedCategory === "all" || loc.category === selectedCategory;
      return materialMatch && categoryMatch;
    });
  }, [locations, selectedMaterials, selectedCategory]);

  // Persist filter state to the URL so it survives reloads and can be shared.
  // Preserve any existing params (e.g. ?focus=<slug>).
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedCategory === "all") params.delete("category");
    else params.set("category", selectedCategory);
    if (selectedMaterials.length === 0) params.delete("materials");
    else params.set("materials", selectedMaterials.join(","));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedMaterials]);

  const nearest = useMemo(
    () => (origin ? nearestTo(origin, filtered, NEAREST_COUNT) : []),
    [origin, filtered]
  );

  const focusOrigin = useCallback((pos: LatLng) => {
    setOrigin(pos);
    setPicking(false);
    // The drawer is mobile-only; reopening it there brings the results into view.
    setFilterOpen(true);

    const map = mapRef.current;
    if (!map) return;
    const top = nearestTo(pos, filtered, NEAREST_COUNT);
    if (top.length === 0) {
      map.panTo(pos);
      map.setZoom(14);
      return;
    }
    const bounds = new google.maps.LatLngBounds(pos);
    top.forEach(({ location }) => bounds.extend(location.position));
    map.fitBounds(bounds, 80);
  }, [filtered]);

  const locateUser = useCallback(() => {
    if (locating) return;
    if (!navigator.geolocation) {
      toast.error(t("map.geoUnavailable"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        const pos = { lat: coords.latitude, lng: coords.longitude };
        if (insideAstana(pos)) focusOrigin(pos);
        else toast.error(t("nearest.outsideCity"));
      },
      () => {
        setLocating(false);
        toast.error(t("map.geoError"));
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [locating, focusOrigin, t]);

  const togglePicking = () => {
    // Close the mobile drawer so the map underneath can be tapped.
    if (!picking) setFilterOpen(false);
    setPicking(!picking);
  };

  const clearOrigin = () => {
    setOrigin(null);
    setPicking(false);
  };

  const handleMarkerClick = useCallback((loc: Location) => {
    setSelectedLocation(loc);
    setFilterOpen(false);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: loc.position.lat, lng: loc.position.lng });
    }
  }, []);

  const nearestPanel = (
    <NearestPanel
      origin={origin}
      nearest={nearest}
      locating={locating}
      picking={picking}
      onOrigin={focusOrigin}
      onLocate={locateUser}
      onTogglePick={togglePicking}
      onClear={clearOrigin}
      onSelect={handleMarkerClick}
    />
  );

  const mapOptions: google.maps.MapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      clickableIcons: false,
      zoomControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      styles: resolvedTheme === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT,
      gestureHandling: "greedy",
      restriction: {
        latLngBounds: ASTANA_BOUNDS,
        strictBounds: false,
      },
      minZoom: 10,
      draggableCursor: picking ? "crosshair" : undefined,
    }),
    [resolvedTheme, picking]
  );

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <p className="text-sm text-destructive">{t("map.loadError")}</p>
      </div>
    );
  }

  if (!isLoaded || isLoadingData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-[280px] h-[180px] rounded-xl" />
          <p className="text-sm text-muted-foreground">{t("map.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex">
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-background overflow-y-auto scroll-clean">
        <div className="p-4">
          <h2 className="heading text-sm font-bold text-foreground mb-4">
            {t("map.title")}
          </h2>
          {nearestPanel}
          <div className="border-t border-border my-4" />
          <FilterPanel
            selectedMaterials={selectedMaterials}
            selectedCategory={selectedCategory}
            onMaterialsChange={setSelectedMaterials}
            onCategoryChange={setSelectedCategory}
          />
        </div>
        <div className="px-4 pb-4 mt-auto">
          <p className="text-xs text-muted-foreground">
            {filtered.length} {t("map.pointsCount")}
          </p>
        </div>
      </aside>

      <div className="relative flex-1 min-w-0">
        <GoogleMap
          mapContainerClassName="w-full h-full"
          center={initialCenter}
          zoom={ASTANA_DEFAULT_ZOOM}
          options={mapOptions}
          onLoad={(map) => { mapRef.current = map; setMapInstance(map); }}
          onClick={(e) => {
            if (picking && e.latLng) focusOrigin({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            else setSelectedLocation(null);
          }}
        >
          {origin && (
            <Marker
              position={origin}
              title={t("nearest.youAreHere")}
              zIndex={999}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: MARKER_COLORS.user,
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2.5,
              }}
            />
          )}
          <MarkerClusterer
            options={{
              gridSize: 60,
              minimumClusterSize: 3,
              zoomOnClick: false,
              styles: [
                {
                  url: clusterIconUrl(),
                  width: 48,
                  height: 48,
                  textColor: "#ffffff",
                  textSize: 14,
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: "700",
                },
              ],
              calculator: (markers) => ({
                text: String(markers.length),
                index: 1,
                title: "",
              }),
            }}
            onClick={(cluster) => {
              const map = mapRef.current;
              if (!map) return;
              const center = cluster.getCenter();
              if (!center) return;
              const currentZoom = map.getZoom() ?? ASTANA_DEFAULT_ZOOM;
              const targetZoom = Math.min(currentZoom + 3, 17);
              map.panTo(center);
              // Step zoom with a short delay for a smooth animated feel
              setTimeout(() => map.setZoom(currentZoom + 1), 0);
              setTimeout(() => map.setZoom(currentZoom + 2), 180);
              setTimeout(() => map.setZoom(targetZoom), 360);
            }}
          >
            {(clusterer) => (
              <>
                {filtered.map((loc) => {
                  const isSelected = selectedLocation?.id === loc.id;
                  const color =
                    loc.category === "hub" ? MARKER_COLORS.hub : MARKER_COLORS.kiosk;
                  return (
                    <Marker
                      key={loc.id}
                      position={{ lat: loc.position.lat, lng: loc.position.lng }}
                      clusterer={clusterer}
                      icon={{
                        // viewBox is now -2 -2 32 40 → aspect 0.8.
                        // scaledSize must match the same aspect, otherwise
                        // the pin gets stretched.
                        url: pinSvg(color, isSelected),
                        scaledSize: new google.maps.Size(
                          isSelected ? 44 : 36,
                          isSelected ? 55 : 45
                        ),
                        // Anchor = pin tip in pixel space.
                        // Pin tip in path coords is (14, 36).
                        // In viewBox -2 -2 32 40 → x = (14+2)/32 = 0.5,
                        //                           y = (36+2)/40 = 0.95.
                        anchor: new google.maps.Point(
                          isSelected ? 22 : 18,        // 0.5 × width
                          isSelected ? 52 : 43         // 0.95 × height (rounded)
                        ),
                      }}
                      onClick={() => handleMarkerClick(loc)}
                      onMouseOver={() => setHoveredId(loc.id)}
                      onMouseOut={() => setHoveredId(null)}
                      zIndex={isSelected ? 1000 : 1}
                    />
                  );
                })}

                {/* OverlayView, not InfoWindow: InfoWindow forces a white
                    background, an arrow tail and a close button, which is
                    far too heavy for a hover hint. */}
                {(() => {
                  const hovered = filtered.find((l) => l.id === hoveredId);
                  if (!hovered || hovered.id === selectedLocation?.id) return null;
                  return (
                    <OverlayView
                      position={{
                        lat: hovered.position.lat,
                        lng: hovered.position.lng,
                      }}
                      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                      // Centers the bubble horizontally above the pin tip.
                      // y = -(height + 50) → 50px gap above the 45px pin.
                      getPixelPositionOffset={(width, height) => ({
                        x: -(width / 2),
                        y: -(height + 50),
                      })}
                    >
                      <div
                        className="bg-card border border-border text-foreground text-xs font-semibold rounded-lg px-2.5 py-1 shadow-md whitespace-nowrap pointer-events-none"
                      >
                        {hovered.name[lang]}
                      </div>
                    </OverlayView>
                  );
                })()}
              </>
            )}
          </MarkerClusterer>
        </GoogleMap>

        <MapControls map={mapRef} locating={locating} onLocate={locateUser} />

        {picking && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-background/95 border border-accent/40 text-accent text-xs font-medium rounded-xl pl-3 pr-2 py-2 shadow-lg whitespace-nowrap">
            {t("nearest.pickHint")}
            <button onClick={() => setPicking(false)} aria-label={t("common.cancel")}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Data load failure overlay */}
        {loadFailed && (
          <div className="absolute inset-0 flex items-center justify-center z-[5] pointer-events-none">
            <div className="bg-background/95 border border-border rounded-xl px-6 py-4 text-center shadow-xl pointer-events-auto">
              <p className="text-sm text-muted-foreground">{t("map.dataError")}</p>
              <button
                onClick={loadData}
                className="text-xs text-accent hover:underline mt-1 block mx-auto"
              >
                {t("common.retry")}
              </button>
            </div>
          </div>
        )}

        {!loadFailed && filtered.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-[5] pointer-events-none">
            <div className="bg-background/95 border border-border rounded-xl px-6 py-4 text-center shadow-xl pointer-events-auto">
              <p className="text-sm text-muted-foreground">{t("map.noResults")}</p>
              <button
                onClick={() => {
                  setSelectedMaterials([]);
                  setSelectedCategory("all");
                }}
                className="text-xs text-accent hover:underline mt-1 block mx-auto"
              >
                {t("map.filterClearAll")}
              </button>
            </div>
          </div>
        )}

        <LocationDetailPanel
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />

        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={cn(
            "md:hidden absolute top-4 left-4 z-10",
            "flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg",
            "bg-background/95 border border-border text-sm font-medium",
            filterOpen && "text-accent"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {t("map.filterButton")}
          {selectedMaterials.length > 0 && (
            <span className="ml-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedMaterials.length}
            </span>
          )}
        </button>

        {filterOpen && (
          <>
            <div
              className="md:hidden absolute inset-0 z-[15] bg-black/30"
              onClick={() => setFilterOpen(false)}
            />
            <div className="md:hidden absolute bottom-0 left-0 right-0 z-20 bg-background rounded-t-2xl border-t border-border max-h-[70vh] overflow-y-auto slide-up">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h3 className="heading text-sm font-bold">
                  {t("map.filtersTitle")}
                </h3>
                <button onClick={() => setFilterOpen(false)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="px-4 pb-8">
                {nearestPanel}
                <div className="border-t border-border my-4" />
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
