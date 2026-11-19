import { describe, expect, it } from "vitest";
import en from "@/i18n/en.json";
import kk from "@/i18n/kk.json";
import ru from "@/i18n/ru.json";
import { WASTE_CLASSES } from "@/lib/classify";

const keys = (obj: object, prefix = ""): string[] =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );

describe("translations", () => {
  it("have the same keys in all three languages", () => {
    expect(keys(en).sort()).toEqual(keys(ru).sort());
    expect(keys(kk).sort()).toEqual(keys(ru).sort());
  });

  it("name every model class", () => {
    for (const dict of [en, ru, kk]) {
      expect(Object.keys(dict.classify.classes).sort()).toEqual([...WASTE_CLASSES].sort());
    }
  });
});
