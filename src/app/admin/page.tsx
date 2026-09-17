"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, MapPin, CheckCircle2, AlertCircle,
  Building2, Cpu, Trash2, ExternalLink, RefreshCw, ShieldCheck, Users, Pencil, X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { adminGetAllLocations, adminSetVerified, adminDeleteLocation, adminGetUsers, adminUpdateLocation } from "@/lib/api";
import type { AdminUser, AdminLocationUpdate } from "@/lib/api";
import { MATERIALS, ALL_MATERIALS } from "@/lib/constants";
import { MaterialBadge } from "@/components/shared/MaterialBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Location, MaterialType } from "@/types";

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

function LocationRow({
  loc,
  onToggleVerify,
  onDelete,
  onEdit,
}: {
  loc: Location;
  onToggleVerify: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (loc: Location) => void;
}) {
  const { t } = useLang();
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
          {loc.category === "hub" ? t("admin.typeHub") : t("admin.typeKiosk")}
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
            {loc.verified ? t("admin.verified") : t("admin.unverified")}
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
            title={t("admin.open")}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => onEdit(loc)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title={t("admin.edit")}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggleVerify(loc.id, loc.verified)}
            className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
            title={loc.verified ? t("admin.doUnverify") : t("admin.doVerify")}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
            title={t("admin.delete")}
            onClick={() => onDelete(loc.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function EditLocationModal({
  loc,
  onClose,
  onSaved,
}: {
  loc: Location;
  onClose: () => void;
  onSaved: (updated: Location) => void;
}) {
  const [form, setForm] = useState({
    category: loc.category,
    nameRu: loc.name.ru, nameEn: loc.name.en, nameKk: loc.name.kk,
    descriptionRu: loc.description.ru, descriptionEn: loc.description.en, descriptionKk: loc.description.kk,
    addressRu: loc.address.ru, addressEn: loc.address.en, addressKk: loc.address.kk,
    lat: String(loc.position.lat), lng: String(loc.position.lng),
    phone: loc.phone ?? "", website: loc.website ?? "",
  });
  const [materials, setMaterials] = useState<MaterialType[]>(loc.materials);
  const [photosText, setPhotosText] = useState(loc.photos.join("\n"));
  const [saving, setSaving] = useState(false);
  const { t } = useLang();

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const toggleMaterial = (m: MaterialType) =>
    setMaterials((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const handleSave = async () => {
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      toast.error(t("admin.badCoords"));
      return;
    }
    setSaving(true);
    const patch: AdminLocationUpdate = {
      category: form.category,
      nameRu: form.nameRu, nameEn: form.nameEn, nameKk: form.nameKk,
      descriptionRu: form.descriptionRu, descriptionEn: form.descriptionEn, descriptionKk: form.descriptionKk,
      addressRu: form.addressRu, addressEn: form.addressEn, addressKk: form.addressKk,
      lat, lng, materials,
      phone: form.phone, website: form.website,
      photos: photosText.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    try {
      const updated = await adminUpdateLocation(loc.id, patch);
      toast.success(t("admin.saved"));
      onSaved(updated);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("admin.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, k: keyof typeof form, type = "text") => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={form[k]}
        onChange={(e) => set(k, e.target.value)}
        className="w-full text-sm bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-card border-b border-border px-5 py-3.5 flex items-center justify-between z-10">
          <h2 className="heading text-sm font-bold text-foreground">{t("admin.editTitle")}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t("admin.fieldType")}</label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="hub">{t("admin.typeHub")}</option>
              <option value="kiosk">{t("admin.typeKiosk")}</option>
            </select>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {field(`${t("admin.fieldName")} (RU)`, "nameRu")}
            {field(`${t("admin.fieldName")} (EN)`, "nameEn")}
            {field(`${t("admin.fieldName")} (KK)`, "nameKk")}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {field(`${t("admin.fieldAddress")} (RU)`, "addressRu")}
            {field(`${t("admin.fieldAddress")} (EN)`, "addressEn")}
            {field(`${t("admin.fieldAddress")} (KK)`, "addressKk")}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {field(`${t("admin.fieldDesc")} (RU)`, "descriptionRu")}
            {field(`${t("admin.fieldDesc")} (EN)`, "descriptionEn")}
            {field(`${t("admin.fieldDesc")} (KK)`, "descriptionKk")}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field(t("admin.fieldLat"), "lat")}
            {field(t("admin.fieldLng"), "lng")}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field(t("admin.fieldPhone"), "phone")}
            {field(t("admin.fieldWebsite"), "website")}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {t("admin.fieldPhotos")}
            </label>
            <textarea
              value={photosText}
              onChange={(e) => setPhotosText(e.target.value)}
              rows={3}
              placeholder={"https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg"}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-ring font-mono"
            />
            {photosText.trim() && (
              <div className="flex gap-1.5 flex-wrap pt-1">
                {photosText.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 6).map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt={`${t("location.photoAlt")} ${i + 1}`} className="w-14 h-14 object-cover rounded-lg border border-border" />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("admin.fieldMaterials")}</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_MATERIALS.map((m) => {
                const active = materials.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMaterial(m)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-lg border transition-colors",
                      active
                        ? "border-accent/40 bg-accent/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {MATERIALS[m].label.ru}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-5 py-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-sm px-4 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            {t("admin.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
          >
            {saving ? t("admin.saving") : t("admin.save")}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [tab, setTab] = useState<"locations" | "users">("locations");
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<"all" | "hub" | "kiosk">("all");
  const [filterVerified, setFilterVerified] = useState<"all" | "verified" | "unverified">("all");
  const [editing, setEditing] = useState<Location | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.replace("/map");
    }
  }, [user, authLoading, router]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([adminGetAllLocations(), adminGetUsers()])
      .then(([locs, usrs]) => { setLocations(locs); setUsers(usrs); })
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
    if (!window.confirm(t("admin.confirmDelete"))) return;
    setLocations((prev) => prev.filter((l) => l.id !== id));
    try {
      await adminDeleteLocation(id);
    } catch {
      // Reload on failure
      load();
    }
  }, [load]);

  const hubs = locations.filter((l) => l.category === "hub").length;
  const kiosks = locations.filter((l) => l.category === "kiosk").length;
  const verified = locations.filter((l) => l.verified).length;
  const unverified = locations.filter((l) => !l.verified).length;

  const matCounts: Partial<Record<MaterialType, number>> = {};
  locations.forEach((l) => l.materials.forEach((m) => { matCounts[m] = (matCounts[m] ?? 0) + 1; }));
  const topMaterials = (Object.entries(matCounts) as [MaterialType, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

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
        <p className="text-muted-foreground text-sm">{t("admin.checkingAccess")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <LayoutDashboard className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="heading text-xl font-bold text-foreground">{t("admin.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("admin.subtitle")}</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t("admin.refresh")}
        </button>
      </div>

      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("locations")}
          className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            tab === "locations" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          <MapPin className="w-3.5 h-3.5" /> {t("admin.tabLocations")}
        </button>
        <button
          onClick={() => setTab("users")}
          className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            tab === "users" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          <Users className="w-3.5 h-3.5" /> {t("admin.tabUsers")} {users.length > 0 && <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">{users.length}</span>}
        </button>
      </div>

      {tab === "locations" && <>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={MapPin} label={t("admin.statTotal")} value={locations.length} color="text-accent" />
            <StatCard icon={Building2} label={t("admin.statHubsKiosks")} value={`${hubs} / ${kiosks}`} />
            <StatCard icon={CheckCircle2} label={t("admin.statVerified")} value={verified} color="text-accent" />
            <StatCard icon={AlertCircle} label={t("admin.statPending")} value={unverified} color="text-destructive" sub={unverified > 0 ? t("admin.statPendingSub") : undefined} />
          </div>
        )}

        {/* Material breakdown */}
        {!loading && topMaterials.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="heading text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-accent" />
              {t("admin.topMaterials")}
            </h2>
            <div className="flex flex-wrap gap-3">
              {topMaterials.map(([m, count]) => (
                <div key={m} className="flex items-center gap-2">
                  <MaterialBadge material={m} />
                  <span className="text-xs text-muted-foreground">{count} {t("admin.pointsWord")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <h2 className="heading text-sm font-bold text-foreground shrink-0">
              {t("admin.tabLocations")} ({filtered.length})
            </h2>
            <div className="flex flex-1 gap-2 flex-wrap">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.searchPlaceholder")}
                className="text-sm bg-background border border-border rounded-lg px-3 py-1.5 flex-1 min-w-[140px] focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value as typeof filterCat)}
                className="text-sm bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="all">{t("admin.allTypes")}</option>
                <option value="hub">{t("admin.typeHubs")}</option>
                <option value="kiosk">{t("admin.typeKiosks")}</option>
              </select>
              <select
                value={filterVerified}
                onChange={(e) => setFilterVerified(e.target.value as typeof filterVerified)}
                className="text-sm bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="all">{t("admin.allStatuses")}</option>
                <option value="verified">{t("admin.verifiedPlural")}</option>
                <option value="unverified">{t("admin.unverifiedPlural")}</option>
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
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("admin.colName")}</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{t("admin.colType")}</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">{t("admin.colAddress")}</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden xl:table-cell">{t("admin.colMaterials")}</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("admin.colStatus")}</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("admin.colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        {t("admin.nothingFound")}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((loc) => (
                      <LocationRow key={loc.id} loc={loc} onToggleVerify={handleToggleVerify} onDelete={handleDelete} onEdit={setEditing} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>}

      {tab === "users" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="heading text-sm font-bold text-foreground">{t("admin.usersTitle")} ({users.length})</h2>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("admin.colName")}</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("admin.colEmail")}</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">{t("admin.colRole")}</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{t("admin.colReviews")}</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{t("admin.colSubmissions")}</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">{t("admin.colRegistered")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{u.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          u.role === "ADMIN"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {u.role === "ADMIN" ? t("admin.roleAdmin") : t("admin.roleUser")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{u._count.reviews}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{u._count.submissions}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {new Date(u.createdAt).toLocaleDateString("ru-RU")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editing && (
        <EditLocationModal
          loc={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) =>
            setLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
          }
        />
      )}
    </div>
  );
}
