import { describe, expect, it } from "vitest";
import { ALL_MATERIALS } from "@/lib/constants";
import {
  CLASS_MATERIALS,
  WASTE_CLASSES,
  asksDrinkContainer,
  decide,
  materialsFor,
} from "@/lib/classify";

const probs = (values: Record<string, number>) =>
  WASTE_CLASSES.map((cls) => values[cls] ?? 0);

describe("class to material mapping", () => {
  it("covers every model class", () => {
    expect(Object.keys(CLASS_MATERIALS).sort()).toEqual([...WASTE_CLASSES].sort());
  });

  it("only uses materials the map knows", () => {
    for (const cls of WASTE_CLASSES) {
      for (const material of [...materialsFor(cls), ...materialsFor(cls, true)]) {
        expect(ALL_MATERIALS).toContain(material);
      }
    }
  });

  it("sends cardboard to paper points", () => {
    expect(materialsFor("cardboard")).toEqual(["paper"]);
  });

  it("gives no filter for things no point takes", () => {
    for (const cls of ["food", "vegetation", "trash"] as const) {
      expect(materialsFor(cls)).toEqual([]);
      expect(materialsFor(cls, true)).toEqual([]);
    }
  });

  it("adds fandomats only for drink bottles and cans", () => {
    expect(materialsFor("plastic")).toEqual(["plastic"]);
    expect(materialsFor("plastic", true)).toEqual(["plastic", "bottles"]);
    expect(materialsFor("metal", true)).toEqual(["metal", "aluminium", "bottles"]);
    expect(materialsFor("glass", true)).toEqual(["glass"]);
    expect(asksDrinkContainer("plastic")).toBe(true);
    expect(asksDrinkContainer("paper")).toBe(false);
  });
});

describe("decide", () => {
  it("picks the top class at or above the threshold", () => {
    const result = decide(probs({ glass: 0.8, plastic: 0.15, metal: 0.05 }), 0.8);
    expect(result).toEqual({ kind: "confident", top: { cls: "glass", prob: 0.8 } });
  });

  it("returns the top 3 and no single answer below the threshold", () => {
    const result = decide(probs({ glass: 0.5, plastic: 0.3, metal: 0.15, paper: 0.05 }), 0.6);
    expect(result.kind).toBe("unsure");
    if (result.kind === "unsure") {
      expect(result.options.map((o) => o.cls)).toEqual(["glass", "plastic", "metal"]);
    }
  });

  it("rejects output of the wrong length", () => {
    expect(() => decide([0.5, 0.5], 0.5)).toThrow();
  });
});
