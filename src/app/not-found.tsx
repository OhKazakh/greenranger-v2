"use client";

import { Leaf, MapPin } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { useLang } from "@/context/LangContext";

export default function NotFound() {
  const { t } = useLang();
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Leaf className="w-10 h-10 text-accent" />
        </div>
        <span className="absolute -top-2 -right-3 text-4xl font-bold text-muted-foreground/40 heading">
          404
        </span>
      </div>
      <h1 className="heading text-2xl font-bold text-foreground mb-2">
        {t("notFound.title")}
      </h1>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {t("notFound.message")}
      </p>
      <div className="flex gap-3">
        <ButtonLink href="/">{t("notFound.home")}</ButtonLink>
        <ButtonLink href="/map" variant="outline">
          <MapPin className="w-4 h-4 mr-1.5" />
          {t("notFound.map")}
        </ButtonLink>
      </div>
    </div>
  );
}
