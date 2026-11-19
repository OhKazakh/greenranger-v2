"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/context/LangContext";
import { ALL_MATERIALS, MATERIALS } from "@/lib/constants";
import {
  asksDrinkContainer,
  decide,
  materialsFor,
  type Decision,
  type WasteClass,
} from "@/lib/classify";
import { classifyPhoto, loadWasteModel } from "@/lib/wasteModel";
import { cn } from "@/lib/utils";
import type { MaterialType } from "@/types";

type Step =
  | { name: "idle" }
  | { name: "working"; modelReady: boolean }
  | { name: "result"; decision: Decision }
  | { name: "drink"; cls: WasteClass }
  | { name: "pickMaterial" }
  | { name: "done"; materials: MaterialType[]; label: string };

interface WhatIsThisProps {
  hasOrigin: boolean;
  onApply: (materials: MaterialType[]) => void;
}

const chip =
  "text-[12px] px-2.5 py-1.5 rounded-lg border border-border text-foreground hover:border-accent/50 hover:bg-muted transition-colors";

export function WhatIsThis({ hasOrigin, onApply }: WhatIsThisProps) {
  const { t, lang } = useLang();
  const [step, setStep] = useState<Step>({ name: "idle" });
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modelReady = useRef(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const classLabel = (cls: WasteClass) => t(`classify.classes.${cls}`);
  const percent = (p: number) => t("classify.sure", { percent: Math.round(p * 100) });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setStep({ name: "working", modelReady: modelReady.current });
    try {
      await loadWasteModel();
      modelReady.current = true;
    } catch {
      setStep({ name: "idle" });
      toast.error(t("classify.loadFailed"));
      return;
    }
    try {
      const { probs, threshold } = await classifyPhoto(file);
      setStep({ name: "result", decision: decide(probs, threshold) });
    } catch {
      setStep({ name: "idle" });
      toast.error(t("classify.readFailed"));
    }
  };

  const chooseClass = (cls: WasteClass) => {
    if (asksDrinkContainer(cls)) setStep({ name: "drink", cls });
    else finish(materialsFor(cls), classLabel(cls));
  };

  const finish = (materials: MaterialType[], label: string) => {
    setStep({ name: "done", materials, label });
    if (materials.length > 0) onApply(materials);
  };

  const reset = () => {
    setPreview(null);
    setStep({ name: "idle" });
  };

  return (
    <div>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
        {t("classify.title")}
      </p>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {step.name === "idle" && (
        <>
          <p className="text-[11.5px] text-muted-foreground leading-relaxed mb-2">{t("classify.hint")}</p>
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 text-[12.5px] font-medium px-2 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Camera className="w-4 h-4" />
            {t("classify.takePhoto")}
          </button>
          <p className="text-[11px] text-muted-foreground mt-1.5">{t("classify.privacy")}</p>
        </>
      )}

      {step.name !== "idle" && (
        <div className="flex gap-2.5 items-start">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL, not optimisable
            <img src={preview} alt={t("classify.photoAlt")} className="w-14 h-14 rounded-lg object-cover shrink-0 border border-border" />
          )}
          <div className="min-w-0 flex-1" aria-live="polite">
            {step.name === "working" && (
              <p className="text-[12px] text-muted-foreground animate-pulse">
                {step.modelReady ? t("classify.analyzing") : t("classify.loading")}
              </p>
            )}

            {step.name === "result" && step.decision.kind === "confident" && (
              <>
                <p className="text-[13px] font-semibold text-foreground">
                  {t("classify.looksLike", { material: classLabel(step.decision.top.cls) })}
                </p>
                <p className="text-[11.5px] text-muted-foreground">{percent(step.decision.top.prob)}</p>
                {materialsFor(step.decision.top.cls).length === 0 ? (
                  <p className="text-[12px] text-foreground leading-relaxed mt-2">{t("classify.notAccepted")}</p>
                ) : (
                  <button
                    onClick={() => step.decision.kind === "confident" && chooseClass(step.decision.top.cls)}
                    className={cn(chip, "mt-2 border-accent/50 text-accent")}
                  >
                    {t("classify.showPoints")}
                  </button>
                )}
              </>
            )}

            {step.name === "result" && step.decision.kind === "unsure" && (
              <>
                <p className="text-[12.5px] font-semibold text-foreground">{t("classify.unsure")}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {step.decision.options.map(({ cls, prob }) => (
                    <button key={cls} onClick={() => chooseClass(cls)} className={chip}>
                      {classLabel(cls)} <span className="text-muted-foreground">{Math.round(prob * 100)}%</span>
                    </button>
                  ))}
                  <button onClick={() => setStep({ name: "pickMaterial" })} className={cn(chip, "text-muted-foreground")}>
                    {t("classify.somethingElse")}
                  </button>
                </div>
              </>
            )}

            {step.name === "drink" && (
              <>
                <p className="text-[12.5px] font-semibold text-foreground">{t("classify.drinkQuestion")}</p>
                <div className="flex gap-1.5 mt-2">
                  <button onClick={() => finish(materialsFor(step.cls, true), classLabel(step.cls))} className={chip}>
                    {t("classify.yes")}
                  </button>
                  <button onClick={() => finish(materialsFor(step.cls), classLabel(step.cls))} className={chip}>
                    {t("classify.no")}
                  </button>
                </div>
              </>
            )}

            {step.name === "pickMaterial" && (
              <>
                <p className="text-[12.5px] font-semibold text-foreground">{t("classify.pickMaterial")}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ALL_MATERIALS.map((m) => (
                    <button key={m} onClick={() => finish([m], MATERIALS[m].label[lang])} className={chip}>
                      {MATERIALS[m].label[lang]}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step.name === "done" && (
              <p className="text-[12px] text-foreground leading-relaxed">
                {step.materials.length === 0
                  ? t("classify.notAccepted")
                  : t("classify.showing", {
                      material: step.materials.map((m) => MATERIALS[m].label[lang]).join(", "),
                    })}
                {step.materials.length > 0 && !hasOrigin && (
                  <span className="block text-muted-foreground mt-1">{t("classify.setLocation")}</span>
                )}
              </p>
            )}

            {step.name !== "working" && (
              <button
                onClick={reset}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground mt-2"
              >
                <RotateCcw className="w-3 h-3" />
                {t("classify.another")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
