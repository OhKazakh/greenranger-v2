import { MARKER_COLORS } from "@/lib/constants";
import type { LocationCategory } from "@/types";

interface PinOptions {
  dark: boolean;
  emphasized?: boolean;
}

// Hubs and kiosks differ by glyph as well as color (square vs circle), so the
// distinction survives color blindness. The outline flips with the map: white
// on the dark map, forest on the light one where white would vanish.
export function pinIconUrl(category: LocationCategory, { dark, emphasized = false }: PinOptions): string {
  const fill = category === "hub" ? (dark ? MARKER_COLORS.hubDark : MARKER_COLORS.hub) : MARKER_COLORS.kiosk;
  const stroke = dark ? "#ffffff" : MARKER_COLORS.hub;
  const glyph =
    category === "hub"
      ? `<rect x="9.5" y="8.5" width="9" height="9" rx="2" fill="white" fill-opacity="0.95"/>`
      : `<circle cx="14" cy="13" r="5" fill="white" fill-opacity="0.95"/>`;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 32 40">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
        fill="${fill}" stroke="${stroke}" stroke-width="${emphasized ? 3 : 2}"/>
      ${glyph}
    </svg>
  `;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

// viewBox -2 -2 32 40 has a 0.8 aspect ratio; the tip sits at 50% width, 95% height.
export function pinSize(emphasized: boolean) {
  return emphasized
    ? { width: 44, height: 55, anchorX: 22, anchorY: 52 }
    : { width: 36, height: 45, anchorX: 18, anchorY: 43 };
}
