"use client";

import { useLang } from "@/context/LangContext";
import type { Lang } from "@/types";
import { cn } from "@/lib/utils";

const LANGS: { code: Lang; label: string }[] = [
  { code: "ru", label: "РУ" },
  { code: "en", label: "EN" },
  { code: "kk", label: "ҚАЗ" },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5 w-fit">
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150",
            lang === code
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={lang === code}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
