"use client";

import { useLang } from "@/context/LangContext";
import { MATERIALS, ALL_MATERIALS } from "@/lib/constants";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import type { MaterialType, LocationCategory } from "@/types";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
  selectedMaterials: MaterialType[];
  selectedCategory: LocationCategory | "all";
  onMaterialsChange: (materials: MaterialType[]) => void;
  onCategoryChange: (category: LocationCategory | "all") => void;
  locationCounts?: Partial<Record<MaterialType, number>>;
}

export function FilterPanel({
  selectedMaterials,
  selectedCategory,
  onMaterialsChange,
  onCategoryChange,
  locationCounts,
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

  const CATEGORIES: {
    value: LocationCategory | "all";
    labelKey: "map.categoryAll" | "map.categoryHub" | "map.categoryKiosk";
  }[] = [
    { value: "all", labelKey: "map.categoryAll" },
    { value: "hub", labelKey: "map.categoryHub" },
    { value: "kiosk", labelKey: "map.categoryKiosk" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Category tabs */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          {t("map.categoryLabel")}
        </p>
        <div className="flex flex-col gap-0.5">
          {CATEGORIES.map(({ value, labelKey }) => (
            <button
              key={value}
              onClick={() => onCategoryChange(value)}
              className={cn(
                "text-left text-[12.5px] px-2.5 py-1.5 rounded-lg transition-colors duration-150 font-medium",
                selectedCategory === value
                  ? "bg-primary text-primary-foreground"
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
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            {t("map.filterTitle")}
          </p>
          <button
            onClick={() =>
              allSelected
                ? onMaterialsChange([])
                : onMaterialsChange([...ALL_MATERIALS])
            }
            className="text-[11px] text-accent hover:underline font-mono"
          >
            {noneSelected || !allSelected
              ? t("map.filterSelectAll")
              : t("map.filterClearAll")}
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          {ALL_MATERIALS.map((m) => {
            const meta = MATERIALS[m];
            const isActive = selectedMaterials.includes(m) || noneSelected;
            const count = locationCounts?.[m];
            return (
              <button
                key={m}
                onClick={() => {
                  if (noneSelected) {
                    onMaterialsChange([m]);
                  } else {
                    toggleMaterial(m);
                  }
                }}
                className={cn(
                  "flex items-center gap-2 text-[12.5px] px-2.5 py-1.5 rounded-lg transition-colors duration-150 text-left",
                  isActive
                    ? "text-foreground hover:bg-muted"
                    : "text-muted-foreground opacity-40 hover:opacity-70"
                )}
              >
                {/* Stroke icon — neutral color in filter, material color context */}
                <span className="w-4 h-4 shrink-0 flex items-center justify-center text-muted-foreground">
                  <MaterialIcon material={m} size={15} />
                </span>
                <span className="truncate flex-1">{meta.label[lang]}</span>
                {count !== undefined && (
                  <span className="font-mono text-[11px] text-muted-foreground ml-auto">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
