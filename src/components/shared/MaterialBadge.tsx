import { MATERIALS } from "@/lib/constants";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import type { MaterialType } from "@/types";
import { useLang } from "@/context/LangContext";
import { cn } from "@/lib/utils";

interface MaterialBadgeProps {
  material: MaterialType;
  size?: "sm" | "md";
}

export function MaterialBadge({ material, size = "md" }: MaterialBadgeProps) {
  const { lang } = useLang();
  const meta = MATERIALS[material];
  if (!meta) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium text-white",
        meta.color,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        // paper and aluminium have dark text (light bg)
        (material === "paper" || material === "aluminium") && "text-[#1a1f2a]"
      )}
    >
      <MaterialIcon material={material} size={size === "sm" ? 11 : 12} />
      {meta.label[lang]}
    </span>
  );
}
