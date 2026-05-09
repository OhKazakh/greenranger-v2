"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, MapPin, CheckCircle2, AlertCircle,
  Building2, Cpu, Trash2, ExternalLink, RefreshCw, ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getLocations, adminSetVerified, adminDeleteLocation } from "@/lib/api";
import { MATERIALS } from "@/lib/constants";
import { MaterialBadge } from "@/components/shared/MaterialBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Location, MaterialType } from "@/types";

// ── Stat card ────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-foreground",
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className={cn("w-5 h-5", color)} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-xl font-bold heading", color)}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

// ── Location row ─────────────────────────────────────────────
function LocationRow({
  loc,
  onToggleVerify,
  onDelete,
}: {
  loc: Location;
  onToggleVerify: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              loc.category === "hub" ? "bg-primary" : "bg-accent"
            )}
          />
          <span className="text-sm font-medium text-foreground max-w-[120px] sm:max-w-[200px] truncate">
            {loc.name.ru}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            loc.category === "hub"
              ? "bg-primary/10 text-primary"
              : "bg-accent/10 text-accent"
          )}
        >
          {loc.category === "hub" ? "Хаб" : "Киоск"}
        </span>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <p className="text-xs text-muted-foreground truncate max-w-[160px]">
          {loc.address.ru}
        </p>
      </td>
      <td className="px-4 py-3 hidden xl:table-cell">
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {loc.materials.slice(0, 4).map((m) => (
            <MaterialBadge key={m} material={m} />
          ))}
          {loc.materials.length > 4 && (
            <span className="text-xs text-muted-foreground">+{loc.materials.length - 4}</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onToggleVerify(loc.id, loc.verified)}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors",
            loc.verified
              ? "bg-accent/10 text-accent hover:bg-accent/20"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {loc.verified ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          <span className="hidden sm:inline">
            {loc.verified ? "Верифицирован" : "Не верифицирован"}
          </span>
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <a
            href={`/locations/${loc.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Открыть"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => onToggleVerify(loc.id, loc.verified)}
            className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
            title={loc.verified ? "Снять верификацию" : "Верифицировать"}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
            title="Удалить"
            onClick={() => onDelete(loc.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<"all" | "hub" | "kiosk">("all");
  const [filterVerified, setFilterVerified] = useState<"all" | "verified" | "unverified">("all");

  // Guard: redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.replace("/map");
    }
  }, [user, authLoading, router]);

  const load = useCallback(() => {
    setLoading(true);
    getLocations()
      .then(setLocations)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleVerify = useCallback(async (id: string, current: boolean) => {
    // Optimistic update
    setLocations((prev) =>
      prev.map((l) => (l.id === id ? { ...l, verified: !current } : l))
    );
    try {
      await adminSetVerified(id, !current);
    } catch {
      // Revert on failure
      setLocations((prev) =>
        prev.map((l) => (l.id === id ? { ...l, verified: current } : l))
      );
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm("Удалить этот пункт? Это действие нельзя отменить.")) return;
    setLocations((prev) => prev.filter((l) => l.id !== id));
    try {
      await adminDeleteLocation(id);
    } catch {
      // Reload on failure
      load();
    }
  }, [load]);

  // Derived stats
  const hubs = locations.filter((l) => l.category === "hub").length;
  const kiosks = locations.filter((l) => l.category === "kiosk").length;
  const verified = locations.filter((l) => l.verified).length;
  const unverified = locations.filter((l) => !l.verified).length;

  // Material distribution
  const matCounts: Partial<Record<MaterialType, number>> = {};
  locations.forEach((l) => l.materials.forEach((m) => { matCounts[m] = (matCounts[m] ?? 0) + 1; }));
  const topMaterials = (Object.entries(matCounts) as [MaterialType, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Filtered table
  const filtered = locations.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.name.ru.toLowerCase().includes(q) || l.address.ru.toLowerCase().includes(q);
    const matchCat = filterCat === "all" || l.category === filterCat;
    const matchVerified =
      filterVerified === "all" ||
      (filterVerified === "verified" && l.verified) ||
      (filterVerified === "unverified" && !l.verified);
    return matchSearch && matchCat && matchVerified;
  });

  if (authLoading || (!authLoading && user?.role !== "admin")) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-sm">Проверка доступа…</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <LayoutDashboard className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="heading text-xl font-bold text-foreground">Панель администратора</h1>
            <p className="text-xs text-muted-foreground">GreenRanger — управление контентом</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Обновить
        </button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={MapPin} label="Всего пунктов" value={locations.length} color="text-accent" />
          <StatCard icon={Building2} label="Хабы / Киоски" value={`${hubs} / ${kiosks}`} />
          <StatCard icon={CheckCircle2} label="Верифицировано" value={verified} color="text-accent" />
          <StatCard icon={AlertCircle} label="На проверке" value={unverified} color="text-destructive" sub={unverified > 0 ? "требуют проверки" : undefined} />
        </div>
      )}

      {/* Material breakdown */}
      {!loading && topMaterials.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="heading text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent" />
            Топ материалов
          </h2>
          <div className="flex flex-wrap gap-3">
            {topMaterials.map(([m, count]) => (
              <div key={m} className="flex items-center gap-2">
                <MaterialBadge material={m} />
                <span className="text-xs text-muted-foreground">{count} пунктов</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locations table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Table toolbar */}
        <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <h2 className="heading text-sm font-bold text-foreground shrink-0">
            Пункты ({filtered.length})
          </h2>
          <div className="flex flex-1 gap-2 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск…"
              className="text-sm bg-background border border-border rounded-lg px-3 py-1.5 flex-1 min-w-[140px] focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value as typeof filterCat)}
              className="text-sm bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">Все типы</option>
              <option value="hub">Хабы</option>
              <option value="kiosk">Киоски</option>
            </select>
            <select
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value as typeof filterVerified)}
              className="text-sm bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">Все статусы</option>
              <option value="verified">Верифицированные</option>
              <option value="unverified">Не верифицированные</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Название</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Тип</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Адрес</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden xl:table-cell">Материалы</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Статус</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      Ничего не найдено
                    </td>
                  </tr>
                ) : (
                  filtered.map((loc) => (
                    <LocationRow key={loc.id} loc={loc} onToggleVerify={handleToggleVerify} onDelete={handleDelete} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
