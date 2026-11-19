import type { MaterialType } from "@/types";

// Model output order. Must match ml/classes.py; a test checks it against
// public/models/waste-labels.json.
export const WASTE_CLASSES = [
  "cardboard",
  "paper",
  "plastic",
  "glass",
  "metal",
  "textile",
  "food",
  "vegetation",
  "trash",
] as const;

export type WasteClass = (typeof WASTE_CLASSES)[number];

// Empty list = no point on the map takes it.
export const CLASS_MATERIALS: Record<WasteClass, MaterialType[]> = {
  cardboard: ["paper"],
  paper: ["paper"],
  plastic: ["plastic"],
  glass: ["glass"],
  metal: ["metal"],
  textile: ["clothes"],
  food: [],
  vegetation: [],
  trash: [],
};

// Fandomats and most hubs take drink bottles and cans as "bottles"/"aluminium".
// The model can't tell a PET bottle from a bag or a can from a pan, so we ask.
export const DRINK_CONTAINER_MATERIALS: Partial<Record<WasteClass, MaterialType[]>> = {
  plastic: ["bottles"],
  metal: ["aluminium", "bottles"],
};

export function asksDrinkContainer(cls: WasteClass): boolean {
  return cls in DRINK_CONTAINER_MATERIALS;
}

export function materialsFor(cls: WasteClass, drinkContainer = false): MaterialType[] {
  const extra = drinkContainer ? DRINK_CONTAINER_MATERIALS[cls] ?? [] : [];
  return [...CLASS_MATERIALS[cls], ...extra];
}

export interface Prediction {
  cls: WasteClass;
  prob: number;
}

export function topK(probs: ArrayLike<number>, k: number): Prediction[] {
  return Array.from(probs, (prob, i) => ({ cls: WASTE_CLASSES[i], prob }))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, k);
}

export type Decision =
  | { kind: "confident"; top: Prediction }
  | { kind: "unsure"; options: Prediction[] };

// Below the threshold we never pick for the user: they choose from the top 3.
export function decide(probs: ArrayLike<number>, threshold: number): Decision {
  if (probs.length !== WASTE_CLASSES.length) {
    throw new Error(`expected ${WASTE_CLASSES.length} probabilities, got ${probs.length}`);
  }
  const options = topK(probs, 3);
  return options[0].prob >= threshold
    ? { kind: "confident", top: options[0] }
    : { kind: "unsure", options };
}
