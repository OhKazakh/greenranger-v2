"use client";

import { useLang } from "@/context/LangContext";
import { MATERIALS, ALL_MATERIALS } from "@/lib/constants";
import type { MaterialType, LocationCategory } from "@/types";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
  selectedMaterials: MaterialType[];
  selectedCategory: LocationCategory | "all";
  onMaterialsChange: (materials: MaterialType[]) => void;
  onCategoryChange: (category: LocationCategory | "all") => void;
}

export function FilterPanel({
  selectedMaterials,
  selectedCategory,
  onMaterialsChange,
  onCategoryChange,
}: FilterPanelProps) {
  const { t, lang } = useLang();

  const toggleMaterial = (m: MaterialType) => {
    if (selectedMaterials.includes(m)) {
      onMaterialsChange(selectedMaterials.filter((x) => x !== m));
    } else {
      onMaterialsChange([...selectedMaterials, m]);
    }
  };

  const allSelected = selectedMaterials.length === ALL_MATERIALS.length;
  const noneSelected = selectedMaterials.length === 0;

  const CATEGORIES: { value: LocationCategory | "all"; labelKey: "map.categoryAll" | "map.categoryHub" | "map.categoryKiosk" }[] = [
    { value: "all", labelKey: "map.categoryAll" },
    { value: "hub", labelKey: "map.categoryHub" },
    { value: "kiosk", labelKey: "map.categoryKiosk" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Category tabs */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          {t("map.categoryLabel")}
        </p>
        <div className="flex flex-col gap-1">
          {CATEGORIES.map(({ value, labelKey }) => (
            <button
              key={value}
              onClick={() => onCategoryChange(value)}
              className={cn(
                "text-left text-sm px-3 py-1.5 rounded-lg transition-colors",
                selectedCategory === value
                  ? "bg-primary text-white font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Material filters */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t("map.filterTitle")}
          </p>
          <button
            onClick={() =>
              allSelected ? onMaterialsChange([]) : onMaterialsChange([...ALL_MATERIALS])
            }
            className="text-xs text-accent hover:underline"
          >
            {noneSelected || !allSelected ? t("map.filterSelectAll") : t("map.filterClearAll")}
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {ALL_MATERIALS.map((m) => {
            const meta = MATERIALS[m];
            const isSelected = selectedMaterials.includes(m) || noneSelected;
            return (
              <button
                key={m}
                onClick={() => {
                  // If none are selected (show-all mode), start filtering by clicking one
                  if (noneSelected) {
                    onMaterialsChange([m]);
                  } else {
                    toggleMaterial(m);
                  }
                }}
                className={cn(
                  "flex items-center gap-2.5 text-sm px-3 py-1.5 rounded-lg transition-colors text-left",
                  isSelected
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground opacity-50 hover:opacity-100"
                )}
              >
                <span className="text-base" aria-hidden="true">
                  {meta.icon}
                </span>
                {/* Colour dot */}
                <span
                  className={cn("w-2 h-2 rounded-full shrink-0", meta.color)}
                  aria-hidden="true"
                />
                <span className="truncate">{meta.label[lang]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
