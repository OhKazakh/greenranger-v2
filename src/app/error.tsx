"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { useLang } from "@/context/LangContext";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLang();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-destructive" />
      </div>
      <h1 className="heading text-2xl font-bold text-foreground mb-2">
        {t("errorPage.title")}
      </h1>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {t("errorPage.message")}
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>{t("errorPage.retry")}</Button>
        <ButtonLink href="/" variant="outline">
          {t("errorPage.home")}
        </ButtonLink>
      </div>
    </div>
  );
}
