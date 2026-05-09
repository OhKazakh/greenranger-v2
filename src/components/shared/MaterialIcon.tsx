import type { MaterialType } from "@/types";

interface MaterialIconProps {
  material: MaterialType;
  size?: number;
  className?: string;
}

const STROKE_PROPS = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const PATHS: Record<MaterialType, React.ReactNode> = {
  plastic: (
    <>
      <path d="M7 19H4.5a1.5 1.5 0 0 1-1.3-2.25L7 9.5" />
      <path d="M11 19h8.5a1.5 1.5 0 0 0 1.3-2.25l-1-1.75" />
      <path d="m14 16-3 3 3 3" />
      <path d="M8.3 13.6 7 9.5l-4.1 1.1" />
      <path d="m9.3 5.8 1.1-1.9a1.5 1.5 0 0 1 2.6 0l3.9 6.8" />
      <path d="m13.4 9.6 4.1 1.1 1.1-4.1" />
    </>
  ),
  paper: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </>
  ),
  glass: (
    <>
      <path d="M8 22h8" />
      <path d="M12 15v7" />
      <path d="M7 3h10v6a5 5 0 0 1-10 0V3Z" />
    </>
  ),
  metal: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.5 5.5l2 2M16.5 16.5l2 2M18.5 5.5l-2 2M7.5 16.5l-2 2" />
    </>
  ),
  aluminium: (
    <>
      <ellipse cx="12" cy="5" rx="6" ry="2" />
      <path d="M6 5v14c0 1.1 2.7 2 6 2s6-.9 6-2V5" />
      <path d="M6 10c1.6.9 4 1.2 6 1.2s4.4-.3 6-1.2" />
    </>
  ),
  bottles: (
    <>
      <path d="M10 2h4v5c2.5 1 3 3 3 5v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8c0-2 .5-4 3-5z" />
      <path d="M11 2v3M13 2v3" />
    </>
  ),
  clothes: (
    <>
      <path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.1a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.3-2.2z" />
    </>
  ),
  electronics: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  batteries: (
    <>
      <rect x="2" y="8" width="18" height="8" rx="1.5" />
      <path d="M22 11v2" />
      <path d="M6 11v2M10 11v2" />
    </>
  ),
  industrial: (
    <>
      <path d="M2 22h20" />
      <path d="M3 22V11l6 4V8l6 4V5l6 4v13" />
      <path d="M7 18h.01M11 18h.01M15 18h.01M19 18h.01" />
    </>
  ),
};

export function MaterialIcon({ material, size = 14, className }: MaterialIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      {...STROKE_PROPS}
    >
      {PATHS[material]}
    </svg>
  );
}
