"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Check, Copy } from "lucide-react";
import { MaterialBadge } from "@/components/shared/MaterialBadge";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { MATERIALS, ALL_MATERIALS, MARKER_COLORS } from "@/lib/constants";
import { useLang } from "@/context/LangContext";
import type { Lang, MaterialType } from "@/types";
import { cn } from "@/lib/utils";

// ── Palette options ───────────────────────────────────────────
const PALETTES = {
  eco: {
    label: "Eco Green (current)",
    sub: "v1 identity — forest green + warm sand + teal",
    primary: "#1B4332",
    accent: "#2EC4B6",
    leaf: "#2EC4B6",
    bg: "#FAFAF5",
    surface: "#FFFFFF",
  },
  civic: {
    label: "Civic Blue (v2 design export)",
    sub: "navy + electric blue",
    primary: "#0A2540",
    accent: "#0070F3",
    leaf: "#2EC4B6",
    bg: "#F5F5F7",
    surface: "#FFFFFF",
  },
};

// ── Token table ───────────────────────────────────────────────
const BRAND_TOKENS = [
  { token: "--forest / --primary", value: "#1B4332", role: "Primary buttons, navbar, hub pins" },
  { token: "--teal / --accent", value: "#2EC4B6", role: "Links, kiosk pins, focus rings, CTAs" },
  { token: "--sand / --secondary", value: "#E9D8A6", role: "Warm secondary surface, tags" },
  { token: "--leaf", value: "#2EC4B6", role: "Logo glyph + verified badge" },
];

const SURFACE_TOKENS = [
  { token: "--background", value: "#FAFAF5", dark: "#1A1A2E", role: "Page background" },
  { token: "--card", value: "#FFFFFF", dark: "#212135", role: "Cards, panels" },
  { token: "--muted", value: "#EEEADE", dark: "#272740", role: "Muted surfaces, skeletons" },
  { token: "--border", value: "#D4CCB4", dark: "rgba(255,255,255,.08)", role: "Dividers, input borders" },
  { token: "--muted-foreground", value: "#5A6B5E", dark: "#8BA090", role: "Secondary text, labels" },
];

const MATERIAL_LIST = ALL_MATERIALS.map((m) => {
  const colorMap: Record<MaterialType, string> = {
    plastic: "#3B82F6",
    paper: "#EAB308",
    glass: "#06B6D4",
    metal: "#6B7280",
    aluminium: "#94A3B8",
    bottles: "#10B981",
    clothes: "#A855F7",
    electronics: "#F97316",
    batteries: "#EF4444",
    industrial: "#52525B",
  };
  return { type: m, color: colorMap[m] };
});

// ── Helpers ───────────────────────────────────────────────────
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {value}
    </button>
  );
}

function Swatch({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <span
      className="rounded inline-block ring-1 ring-black/10 dark:ring-white/10 shrink-0"
      style={{ background: color, width: size, height: size }}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-3">
      {children}
    </p>
  );
}

// ── Demo location card (no deps on router) ────────────────────
function DemoCard({ category }: { category: "hub" | "kiosk" }) {
  const isHub = category === "hub";
  const dotColor = isHub ? MARKER_COLORS.hub : MARKER_COLORS.kiosk;
  const materials: MaterialType[] = isHub
    ? ["plastic", "paper", "glass", "metal"]
    : ["batteries", "electronics"];
  return (
    <div className="rounded-xl overflow-hidden bg-card shadow-[var(--shadow-card,0_1px_3px_rgba(0,0,0,.06),0_0_0_1px_rgba(0,0,0,.06))] w-full max-w-xs">
      <div className="h-0.5 w-full" style={{ background: dotColor }} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: dotColor }}>
            {isHub ? "Recycling Hub" : "Kiosk"}
          </span>
          {isHub && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#2EC4B6]">
              <Check className="w-3 h-3" strokeWidth={2.5} />
              Verified
            </span>
          )}
        </div>
        <h3 className="font-heading font-bold text-[15px] text-foreground leading-tight mb-1">
          {isHub ? "KazRecycleService" : "EcoBox Kiosk"}
        </h3>
        <p className="text-[12px] text-muted-foreground mb-3 flex items-center gap-1">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
          </svg>
          {isHub ? "Металлургов ст, 12" : "ул. Сейфуллина 8"}
        </p>
        <div className="flex flex-wrap gap-1">
          {materials.map((m) => (
            <MaterialBadge key={m} material={m} size="sm" />
          ))}
        </div>
      </div>
      <div className="px-4 pb-4">
        <button className="w-full text-[12px] font-medium h-8 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors">
          View details →
        </button>
      </div>
    </div>
  );
}

// ── Filter demo ───────────────────────────────────────────────
function FilterDemo() {
  const [active, setActive] = useState<MaterialType[]>([]);
  const [cat, setCat] = useState<"all" | "hub" | "kiosk">("all");
  return (
    <div className="w-56 bg-card rounded-xl shadow-[var(--shadow-card,0_1px_3px_rgba(0,0,0,.06),0_0_0_1px_rgba(0,0,0,.06))] p-4">
      <SectionLabel>Category</SectionLabel>
      <div className="flex flex-col gap-0.5 mb-4">
        {(["all", "hub", "kiosk"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "text-left text-[12.5px] px-2.5 py-1.5 rounded-lg font-medium capitalize transition-colors",
              cat === c ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {c === "all" ? "All locations" : c === "hub" ? "Hubs" : "Kiosks"}
          </button>
        ))}
      </div>
      <SectionLabel>Materials</SectionLabel>
      <div className="flex flex-col gap-0.5">
        {ALL_MATERIALS.slice(0, 7).map((m) => {
          const isOn = active.length === 0 || active.includes(m);
          return (
            <button
              key={m}
              onClick={() =>
                setActive((prev) =>
                  prev.length === 0
                    ? [m]
                    : prev.includes(m)
                    ? prev.filter((x) => x !== m)
                    : [...prev, m]
                )
              }
              className={cn(
                "flex items-center gap-2 text-[12.5px] px-2.5 py-1.5 rounded-lg transition-colors",
                isOn ? "text-foreground hover:bg-muted" : "text-muted-foreground opacity-40"
              )}
            >
              <span className="w-4 h-4 flex items-center justify-center text-muted-foreground shrink-0">
                <MaterialIcon material={m} size={14} />
              </span>
              <span className="truncate">{MATERIALS[m].label.en}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Map pin demo ──────────────────────────────────────────────
function PinDemo() {
  function Pin({ color, label, selected }: { color: string; label: string; selected?: boolean }) {
    return (
      <div className="flex flex-col items-center gap-2">
        <svg viewBox="-2 -2 32 40" width={selected ? 40 : 32} height={selected ? 50 : 40} aria-hidden>
          <path
            d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
            fill={color}
            stroke="white"
            strokeWidth={selected ? 3 : 2}
          />
          <circle cx="14" cy="13" r="5" fill="white" fillOpacity="0.95" />
        </svg>
        <span className="text-[11px] font-mono text-muted-foreground">{label}</span>
      </div>
    );
  }
  function Cluster() {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-heading font-bold text-white text-sm ring-4 ring-accent/20">
          12
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">cluster</span>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-8 px-4">
      <Pin color={MARKER_COLORS.hub} label="hub" />
      <Pin color={MARKER_COLORS.hub} label="selected" selected />
      <Pin color={MARKER_COLORS.kiosk} label="kiosk" />
      <Cluster />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function DesignPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { lang, setLang } = useLang();

  const LANGS: Lang[] = ["en", "ru", "kk"];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0"
              style={{ background: "var(--forest)" }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--teal)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 22V12M12 12C12 7 7 4 3 6M12 12C12 7 17 4 21 6M3 6c0 7 3 10 9 16M21 6c0 7-3 10-9 16" />
              </svg>
            </div>
            <span className="font-heading font-bold text-[15px] tracking-tight">GreenRanger</span>
            <span className="font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              design system
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Lang switcher */}
            <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-mono text-[11px] transition-colors",
                    lang === l
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-24">

        {/* ── HERO ── */}
        <section className="pt-12 pb-10 border-b border-border">
          <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest mb-3">
            Civic utility · Astana, Kazakhstan
          </p>
          <h1 className="font-heading font-bold text-[40px] leading-[1.05] tracking-tight max-w-[16ch] mb-4">
            A design system for finding where your bottle goes.
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[60ch] mb-6">
            GreenRanger v2 keeps the{" "}
            <strong className="text-foreground">v1 eco-green identity</strong> — forest green primary,
            warm sand surfaces, teal accent. Trustworthy, dense, trilingual.
          </p>
          <div className="flex gap-6 flex-wrap">
            {[["3", "Brand colors"], ["10", "Material types"], ["3", "Typefaces"], ["2", "Themes"], ["3", "Languages"]].map(([n, l]) => (
              <div key={l} className="flex flex-col gap-0.5">
                <span className="font-heading font-bold text-2xl">{n}</span>
                <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">{l}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── PALETTE COMPARISON ── */}
        <section className="pt-10 pb-10 border-b border-border">
          <h2 className="font-heading font-bold text-[22px] mb-2">Palette options</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Two directions — pick one. The civic palette is what the design system is built on.
            Green is the v1 identity if you want to stay closer to the eco roots.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {(Object.entries(PALETTES) as [keyof typeof PALETTES, typeof PALETTES["eco"]][]).map(
              ([key, pal]) => (
                <div
                  key={key}
                  className={cn(
                    "rounded-xl border p-5 transition-all",
                    key === "eco"
                      ? "border-accent ring-2 ring-accent/20"
                      : "border-border"
                  )}
                >
                  {key === "eco" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded-full mb-3">
                      <Check className="w-3 h-3" /> Current
                    </span>
                  )}
                  <h3 className="font-heading font-bold text-[16px] mb-0.5">{pal.label}</h3>
                  <p className="text-[12px] text-muted-foreground mb-4">{pal.sub}</p>
                  {/* Color swatches */}
                  <div className="flex gap-3 mb-4">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-14 h-14 rounded-xl shadow-sm" style={{ background: pal.primary }} />
                      <span className="font-mono text-[10px] text-muted-foreground">{pal.primary}</span>
                      <span className="text-[10px] text-muted-foreground">primary</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-14 h-14 rounded-xl shadow-sm" style={{ background: pal.accent }} />
                      <span className="font-mono text-[10px] text-muted-foreground">{pal.accent}</span>
                      <span className="text-[10px] text-muted-foreground">accent</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-14 h-14 rounded-xl shadow-sm" style={{ background: pal.leaf }} />
                      <span className="font-mono text-[10px] text-muted-foreground">{pal.leaf}</span>
                      <span className="text-[10px] text-muted-foreground">leaf / teal</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-14 h-14 rounded-xl shadow-sm border border-border" style={{ background: pal.bg }} />
                      <span className="font-mono text-[10px] text-muted-foreground">{pal.bg}</span>
                      <span className="text-[10px] text-muted-foreground">bg</span>
                    </div>
                  </div>
                  {/* Mini button preview */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      className="h-8 px-3 rounded-lg text-[12px] font-medium text-white transition-opacity hover:opacity-90"
                      style={{ background: pal.primary }}
                    >
                      Primary
                    </button>
                    <button
                      className="h-8 px-3 rounded-lg text-[12px] font-medium text-white transition-opacity hover:opacity-90"
                      style={{ background: pal.accent }}
                    >
                      Accent
                    </button>
                    <button
                      className="h-8 px-3 rounded-lg text-[12px] font-medium border border-border bg-card text-foreground hover:bg-muted transition-colors"
                    >
                      Outline
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* ── BRAND TOKENS ── */}
        <section className="pt-10 pb-10 border-b border-border">
          <h2 className="font-heading font-bold text-[22px] mb-2">Brand tokens</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Three semantic roles. Every colour in the UI derives from one of these.
          </p>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-10" />
                  <th className="text-left px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Token</th>
                  <th className="text-left px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Value</th>
                  <th className="text-left px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {BRAND_TOKENS.map((t) => (
                  <tr key={t.token} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <Swatch color={t.value} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">{t.token}</td>
                    <td className="px-4 py-3">
                      <CopyButton value={t.value} />
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground hidden sm:table-cell">{t.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── SURFACE TOKENS ── */}
        <section className="pt-10 pb-10 border-b border-border">
          <h2 className="font-heading font-bold text-[22px] mb-2">Surfaces</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Light and dark values. Toggle the theme above to preview.
          </p>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-10" />
                  <th className="text-left px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Token</th>
                  <th className="text-left px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Light</th>
                  <th className="text-left px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Dark</th>
                  <th className="text-left px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {SURFACE_TOKENS.map((t) => (
                  <tr key={t.token} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <Swatch color={isDark ? (t.dark.startsWith("rgba") ? t.dark : t.dark) : t.value} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">{t.token}</td>
                    <td className="px-4 py-3"><CopyButton value={t.value} /></td>
                    <td className="px-4 py-3"><CopyButton value={t.dark} /></td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground hidden sm:table-cell">{t.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── TYPOGRAPHY ── */}
        <section className="pt-10 pb-10 border-b border-border">
          <h2 className="font-heading font-bold text-[22px] mb-2">Typography</h2>
          <p className="text-sm text-muted-foreground mb-5">
            <strong className="text-foreground">Space Grotesk</strong> for headings ·{" "}
            <strong className="text-foreground">Inter</strong> for body ·{" "}
            <strong className="text-foreground font-mono">JetBrains Mono</strong> for code &amp; data
          </p>
          <div className="divide-y divide-border">
            {[
              { label: "Display / 40px / 700", className: "font-heading font-bold text-[40px] leading-[1.05] tracking-tight", sample: "Astana Recycles" },
              { label: "H1 / 28px / 700", className: "font-heading font-bold text-[28px] leading-[1.15] tracking-tight", sample: "Find a drop-off point" },
              { label: "H2 / 22px / 700", className: "font-heading font-bold text-[22px] leading-[1.20]", sample: "Material categories" },
              { label: "H3 / 18px / 600", className: "font-heading font-semibold text-[18px] leading-[1.30]", sample: "KazRecycleService" },
              { label: "H4 / 15px / 600", className: "font-heading font-semibold text-[15px] leading-[1.35]", sample: "Collection hub" },
              { label: "Body / 14px / 400", className: "text-[14px] leading-[1.50]", sample: "Accepts plastic, paper, glass and metal in bulk from organisations and individuals." },
              { label: "Body SM / 13px", className: "text-[13px] leading-[1.50] text-muted-foreground", sample: "Open Mon–Fri 09:00–18:00" },
              { label: "Mono / 13px", className: "font-mono text-[13px] leading-[1.40]", sample: "#0A2540  →  --navy" },
              { label: "Eyebrow / 11px", className: "font-heading font-semibold text-[11px] tracking-[0.06em] uppercase text-muted-foreground", sample: "Recycling Hub" },
            ].map((row) => (
              <div key={row.label} className="grid grid-cols-[180px_1fr] gap-4 py-3 items-baseline">
                <span className="font-mono text-[11px] text-muted-foreground">{row.label}</span>
                <span className={row.className}>{row.sample}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── MATERIAL COLORS ── */}
        <section className="pt-10 pb-10 border-b border-border">
          <h2 className="font-heading font-bold text-[22px] mb-2">Material colors</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Each material type has a fixed semantic color used in badges, filter rows, and map overlays.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {MATERIAL_LIST.map(({ type, color }) => (
              <div key={type} className="rounded-xl overflow-hidden bg-card border border-border">
                <div className="h-12 flex items-center justify-center" style={{ background: color }}>
                  <span className="text-white" style={{ color: type === "paper" || type === "aluminium" ? "#1a1f2a" : "white" }}>
                    <MaterialIcon material={type} size={20} />
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="font-heading font-semibold text-[12px] capitalize">{MATERIALS[type].label.en}</p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{color}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <SectionLabel>Badge examples</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {ALL_MATERIALS.map((m) => (
                <MaterialBadge key={m} material={m} />
              ))}
            </div>
          </div>
        </section>

        {/* ── BUTTONS ── */}
        <section className="pt-10 pb-10 border-b border-border">
          <h2 className="font-heading font-bold text-[22px] mb-2">Buttons</h2>
          <p className="text-sm text-muted-foreground mb-5">Three variants · two sizes.</p>
          <div className="flex flex-wrap gap-3 items-center p-6 rounded-xl border border-border bg-muted/30">
            <button className="h-9 px-4 rounded-[10px] bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-colors">Primary</button>
            <button className="h-9 px-4 rounded-[10px] bg-accent text-white text-[13px] font-medium hover:bg-accent/90 transition-colors">Accent</button>
            <button className="h-9 px-4 rounded-[10px] border border-border bg-card text-foreground text-[13px] font-medium hover:bg-muted transition-colors">Outline</button>
            <button className="h-9 px-4 rounded-[10px] text-muted-foreground text-[13px] font-medium hover:bg-muted hover:text-foreground transition-colors">Ghost</button>
            <button className="h-9 px-4 rounded-[10px] bg-destructive text-white text-[13px] font-medium hover:bg-destructive/90 transition-colors">Destructive</button>
          </div>
          <div className="flex flex-wrap gap-3 items-center p-6 rounded-xl border border-border bg-muted/30 mt-3">
            <button className="h-7 px-3 rounded-lg bg-primary text-white text-[12px] font-medium">Small</button>
            <button className="h-7 px-3 rounded-lg border border-border bg-card text-foreground text-[12px] font-medium">Small outline</button>
            <button className="h-11 px-5 rounded-xl bg-primary text-white text-[14px] font-medium">Large</button>
          </div>
        </section>

        {/* ── MAP PINS ── */}
        <section className="pt-10 pb-10 border-b border-border">
          <h2 className="font-heading font-bold text-[22px] mb-2">Map markers</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Hub = navy · Kiosk = electric blue · Cluster = electric blue round badge.
            The white inner dot scales with the pin size; selected pins are 20% larger.
          </p>
          <div className="p-8 rounded-xl border border-border bg-[#EDE8DC] dark:bg-[#212135]">
            <PinDemo />
          </div>
        </section>

        {/* ── COMPONENTS ── */}
        <section className="pt-10 pb-10 border-b border-border">
          <h2 className="font-heading font-bold text-[22px] mb-6">Components in context</h2>
          <div className="flex flex-col gap-8">
            {/* Location cards */}
            <div>
              <SectionLabel>Location cards</SectionLabel>
              <div className="flex flex-wrap gap-4">
                <DemoCard category="hub" />
                <DemoCard category="kiosk" />
              </div>
            </div>
            {/* Filter panel */}
            <div>
              <SectionLabel>Filter panel</SectionLabel>
              <FilterDemo />
            </div>
            {/* Input */}
            <div>
              <SectionLabel>Search input</SectionLabel>
              <div className="relative w-72">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  className="w-full h-9 pl-9 pr-3 text-[14px] rounded-[10px] border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  placeholder="Search recycling points…"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── DARK SURFACES ── */}
        <section className="pt-10 pb-10">
          <h2 className="font-heading font-bold text-[22px] mb-2">Dark theme surfaces</h2>
          <p className="text-sm text-muted-foreground mb-5">Four depth levels — BG → Surface → Surface-2 → Border.</p>
          <div className="bg-[#1A1A2E] rounded-xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: "Background", bg: "#1A1A2E", border: "rgba(255,255,255,0.08)" },
              { name: "Surface", bg: "#212135", border: "rgba(255,255,255,0.08)" },
              { name: "Surface-2", bg: "#272740", border: "rgba(255,255,255,0.08)" },
              { name: "Teal", bg: "#2EC4B6", border: "transparent" },
            ].map((s) => (
              <div
                key={s.name}
                className="h-20 rounded-xl flex flex-col justify-between p-3"
                style={{ background: s.bg, boxShadow: `0 0 0 1px ${s.border}` }}
              >
                <span className="font-heading font-semibold text-[12px] text-white/90">{s.name}</span>
                <span className="font-mono text-[10px] text-white/50">{s.bg}</span>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
