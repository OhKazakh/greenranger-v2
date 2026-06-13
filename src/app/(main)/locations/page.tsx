"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationCard } from "@/components/shared/LocationCard";
import { FilterPanel } from "@/components/map/FilterPanel";
import { useLang } from "@/context/LangContext";
import { getLocations } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Location, MaterialType, LocationCategory } from "@/types";

function LocationCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="h-1 bg-muted" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Matches a query against a location's names + addresses in all 3 languages.
function matchesQuery(loc: Location, q: string): boolean {
  if (!q) return true;
  const haystack = [
    loc.name.ru, loc.name.en, loc.name.kk,
    loc.address.ru, loc.address.en, loc.address.kk,
  ].join(" ").toLowerCase();
  return haystack.includes(q);
}

export default function LocationsPage() {
  const { t, lang } = useLang();
  const router = useRouter();

  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | "all">("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getLocations()
      .then(setLocations)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return locations.filter((loc) => {
      const materialMatch =
        selectedMaterials.length === 0 ||
        selectedMaterials.some((m) => loc.materials.includes(m));
      const categoryMatch =
        selectedCategory === "all" || loc.category === selectedCategory;
      return materialMatch && categoryMatch && matchesQuery(loc, q);
    });
  }, [locations, selectedMaterials, selectedCategory, search]);

  // Autocomplete suggestions — top matches by name/address, ignoring other filters.
  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return [];
    return locations.filter((loc) => matchesQuery(loc, q)).slice(0, 6);
  }, [locations, search]);

  const goToLocation = (slug: string) => {
    setShowSuggestions(false);
    router.push(`/locations/${slug}`);
  };

  const activeFilterCount = selectedMaterials.length + (selectedCategory !== "all" ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="heading text-2xl font-bold text-foreground mb-1">
          {t("locations.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("locations.subtitle", { count: String(filtered.length) })}
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden md:block w-56 shrink-0">
          <FilterPanel
            selectedMaterials={selectedMaterials}
            selectedCategory={selectedCategory}
            onMaterialsChange={setSelectedMaterials}
            onCategoryChange={setSelectedCategory}
          />
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Search + mobile filter button */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t("locations.search")}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  // Delay so a click on a suggestion registers before hiding.
                  blurTimer.current = setTimeout(() => setShowSuggestions(false), 150);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && suggestions.length > 0) {
                    goToLocation(suggestions[0].slug);
                  } else if (e.key === "Escape") {
                    setShowSuggestions(false);
                  }
                }}
                className={cn("pl-9", search && "pr-9")}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setShowSuggestions(false); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
                  aria-label={t("actions.clear")}
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Autocomplete dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-30 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                  {suggestions.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (blurTimer.current) clearTimeout(blurTimer.current);
                        goToLocation(loc.slug);
                      }}
                      className="w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-muted transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground truncate">
                          {loc.name[lang]}
                        </span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {loc.address[lang]}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Mobile filter button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className={cn(
                "md:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium shrink-0 transition-colors",
                activeFilterCount > 0
                  ? "bg-accent/10 border-accent/30 text-accent"
                  : "bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="bg-accent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <LocationCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">{t("locations.noResults")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((loc) => (
                <LocationCard key={loc.id} location={loc} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFilterOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl border-t border-border max-h-[80vh] overflow-y-auto slide-up">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="heading text-sm font-bold">{t("map.filtersTitle")}</h3>
              <button onClick={() => setMobileFilterOpen(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="px-4 pb-10">
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
  );
}
