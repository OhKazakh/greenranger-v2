"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, MapPin, MessageSquare, UserIcon, Clock, CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { getMyActivity, type MyActivity } from "@/lib/api";
import type { Lang } from "@/types";

function localeFor(lang: Lang) {
  return lang === "ru" ? "ru-RU" : lang === "kk" ? "kk-KZ" : "en-US";
}

function pickName(
  item: { nameRu: string; nameEn: string; nameKk: string },
  lang: Lang
) {
  return lang === "ru" ? item.nameRu : lang === "kk" ? item.nameKk : item.nameEn;
}

function StatusBadge({ verified }: { verified: boolean }) {
  const { t } = useLang();
  return verified ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-accent">
      <CheckCircle2 className="w-3 h-3" />
      {t("profile.published")}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
      <Clock className="w-3 h-3" />
      {t("profile.pending")}
    </span>
  );
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, lang } = useLang();
  const [data, setData] = useState<MyActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"reviews" | "submissions">("reviews");

  useEffect(() => {
    if (!isAuthenticated) return;
    getMyActivity()
      .then(setData)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{t("profile.loading")}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <UserIcon className="w-6 h-6 text-muted-foreground" />
        </div>
        <h1 className="heading text-xl font-bold mb-2">{t("profile.title")}</h1>
        <p className="text-muted-foreground text-sm mb-6">{t("profile.requiresAuth")}</p>
        <ButtonLink href="/login">{t("profile.login")}</ButtonLink>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <UserIcon className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="heading text-xl font-bold text-foreground">{user?.name}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border">
        {(["reviews", "submissions"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {key === "reviews" ? t("profile.reviewsTab") : t("profile.submissionsTab")}
            {data && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                {key === "reviews" ? data.reviews.length : data.submissions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("profile.loading")}</p>
      ) : tab === "reviews" ? (
        data && data.reviews.length > 0 ? (
          <div className="space-y-3">
            {data.reviews.map((r) => (
              <Link
                key={r.id}
                href={`/locations/${r.location.slug}`}
                className="block p-4 rounded-xl border border-border hover:border-accent/40 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="text-sm font-semibold text-foreground">
                    {pickName(r.location, lang)}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString(localeFor(lang))}
                  </span>
                </div>
                <div className="flex gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      width={13}
                      height={13}
                      fill={s <= r.rating ? "var(--teal)" : "transparent"}
                      stroke={s <= r.rating ? "var(--teal)" : "currentColor"}
                      className="text-muted-foreground"
                    />
                  ))}
                </div>
                {r.comment && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{t("profile.noReviews")}</p>
          </div>
        )
      ) : data && data.submissions.length > 0 ? (
        <div className="space-y-3">
          {data.submissions.map((s) => {
            const inner = (
              <>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="text-sm font-semibold text-foreground">
                    {pickName(s, lang)}
                  </span>
                  <span className="ml-auto">
                    <StatusBadge verified={s.verified} />
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-[22px]">
                  {new Date(s.createdAt).toLocaleDateString(localeFor(lang))}
                </p>
              </>
            );
            // Unverified submissions aren't publicly viewable yet (404), so don't link them.
            return s.verified ? (
              <Link
                key={s.id}
                href={`/locations/${s.slug}`}
                className="block p-4 rounded-xl border border-border hover:border-accent/40 transition-colors"
              >
                {inner}
              </Link>
            ) : (
              <div
                key={s.id}
                className="block p-4 rounded-xl border border-border"
              >
                {inner}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{t("profile.noSubmissions")}</p>
          <ButtonLink href="/submit" variant="outline" className="mt-4">
            {t("nav.submit")}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
