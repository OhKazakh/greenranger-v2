"use client";

import { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationCard } from "@/components/shared/LocationCard";
import { FilterPanel } from "@/components/map/FilterPanel";
import { useLang } from "@/context/LangContext";
import { getLocations } from "@/lib/api";
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

export default function LocationsPage() {
  const { t } = useLang();

  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | "all">("all");

  useEffect(() => {
    getLocations()
      .then(setLocations)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return locations.filter((loc) => {
      const materialMatch =
        selectedMaterials.length === 0 ||
        selectedMaterials.some((m) => loc.materials.includes(m));
      const categoryMatch =
        selectedCategory === "all" || loc.category === selectedCategory;
      const searchMatch =
        search.trim() === "" ||
        loc.name.ru.toLowerCase().includes(search.toLowerCase()) ||
        loc.name.en.toLowerCase().includes(search.toLowerCase()) ||
        loc.address.ru.toLowerCase().includes(search.toLowerCase());
      return materialMatch && categoryMatch && searchMatch;
    });
  }, [locations, selectedMaterials, selectedCategory, search]);

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
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("locations.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
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
    </div>
  );
}
