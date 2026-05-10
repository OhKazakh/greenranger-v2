"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { getReviews, submitReview, deleteReview } from "@/lib/api";
import type { Review, ReviewsResponse } from "@/types";

function StarRating({
  value,
  onChange,
  readonly = false,
  size = 20,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          width={size}
          height={size}
          className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer"}`}
          fill={(readonly ? star <= value : star <= (hovered || value)) ? "var(--teal)" : "transparent"}
          stroke={(readonly ? star <= value : star <= (hovered || value)) ? "var(--teal)" : "currentColor"}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onChange?.(star)}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const { lang } = useLang();
  return (
    <div className="py-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold text-foreground">{review.user.name}</span>
        <StarRating value={review.rating} readonly size={14} />
        <span className="text-xs text-muted-foreground ml-auto">
          {new Date(review.createdAt).toLocaleDateString(
            lang === "ru" ? "ru-RU" : lang === "kk" ? "kk-KZ" : "en-US"
          )}
        </span>
      </div>
      {review.comment && (
        <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}

export function ReviewSection({ slug }: { slug: string }) {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLang();
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myReview = data?.reviews.find((r) => r.user.id === user?.id) ?? null;

  useEffect(() => {
    getReviews(slug)
      .then(setData)
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError(t("reviews.ratingRequired")); return; }
    setSubmitting(true);
    setError(null);
    try {
      await submitReview(slug, { rating, comment: comment.trim() || undefined });
      const fresh = await getReviews(slug);
      setData(fresh);
      setRating(0);
      setComment("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("reviews.errorSubmit"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await deleteReview(slug);
      const fresh = await getReviews(slug);
      setData(fresh);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="heading text-sm font-bold text-foreground">{t("reviews.title")}</h2>
        {data && data.count > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRating value={Math.round(data.avgRating ?? 0)} readonly size={14} />
            <span className="text-sm font-semibold">{data.avgRating?.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({data.count})</span>
          </div>
        )}
      </div>

      {/* Submit form */}
      {isAuthenticated && !myReview && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-muted/40 rounded-xl border border-border space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t("reviews.leaveReview")}
          </p>
          <StarRating value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("reviews.placeholder")}
            rows={2}
            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-accent text-accent-foreground disabled:opacity-50"
          >
            {submitting ? t("reviews.submitting") : t("reviews.submit")}
          </button>
        </form>
      )}

      {/* User's own review */}
      {myReview && (
        <div className="mb-4 p-4 bg-muted/40 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("reviews.yourReview")}
            </p>
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="text-xs text-destructive hover:underline disabled:opacity-50"
            >
              {t("reviews.delete")}
            </button>
          </div>
          <ReviewCard review={myReview} />
        </div>
      )}

      {!isAuthenticated && (
        <p className="text-sm text-muted-foreground mb-4">
          <a href="/login" className="text-accent hover:underline">{t("reviews.loginPrompt")}</a>
          {t("reviews.loginSuffix")}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("reviews.loading")}</p>
      ) : data && data.reviews.filter((r) => r.user.id !== user?.id).length > 0 ? (
        <div className="divide-y divide-border">
          {data.reviews
            .filter((r) => r.user.id !== user?.id)
            .map((r) => <ReviewCard key={r.id} review={r} />)}
        </div>
      ) : !myReview ? (
        <p className="text-sm text-muted-foreground">{t("reviews.noReviews")}</p>
      ) : null}
    </div>
  );
}
