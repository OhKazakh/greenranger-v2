"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Lang } from "@/types";

import ru from "@/i18n/ru.json";
import en from "@/i18n/en.json";
import kk from "@/i18n/kk.json";

// ────────────────────────────────────────────────────────────
//  Type helpers
// ────────────────────────────────────────────────────────────
type TranslationDict = typeof ru;

// Nested key path type — lets TypeScript catch typos in t("nav.map")
type DotPaths<T, Prefix extends string = ""> = {
  [K in keyof T]: T[K] extends Record<string, unknown>
    ? DotPaths<T[K], `${Prefix}${K & string}.`>
    : `${Prefix}${K & string}`;
}[keyof T];

export type TKey = DotPaths<TranslationDict>;

// ────────────────────────────────────────────────────────────
//  Dictionary map
// ────────────────────────────────────────────────────────────
const DICTS: Record<Lang, TranslationDict> = { ru, en, kk };
const STORAGE_KEY = "gr_lang";
const DEFAULT_LANG: Lang = "ru";

// ────────────────────────────────────────────────────────────
//  Context value
// ────────────────────────────────────────────────────────────
interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translate a dot-path key. Supports {{count}} interpolation. */
  t: (key: TKey, vars?: Record<string, string | number>) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

// ────────────────────────────────────────────────────────────
//  Provider
// ────────────────────────────────────────────────────────────
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && stored in DICTS) setLangState(stored);
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  /**
   * Resolve a dot-path key like "nav.map" against the current dictionary.
   * Falls back to English, then the key itself.
   */
  const t = useCallback(
    (key: TKey, vars?: Record<string, string | number>): string => {
      const parts = (key as string).split(".");
      // Walk the dict
      const resolve = (dict: Record<string, unknown>): string | undefined => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let node: any = dict;
        for (const part of parts) {
          if (node == null || typeof node !== "object") return undefined;
          node = node[part];
        }
        return typeof node === "string" ? node : undefined;
      };

      let result =
        resolve(DICTS[lang] as Record<string, unknown>) ??
        resolve(DICTS.en as Record<string, unknown>) ??
        (key as string);

      // Simple interpolation: {{varName}}
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
        }
      }

      return result;
    },
    [lang]
  );

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

// ────────────────────────────────────────────────────────────
//  Hook
// ────────────────────────────────────────────────────────────
export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}
