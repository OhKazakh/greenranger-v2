import { MATERIALS } from "@/lib/constants";
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
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      )}
    >
      <span aria-hidden="true">{meta.icon}</span>
      {meta.label[lang]}
    </span>
  );
}
