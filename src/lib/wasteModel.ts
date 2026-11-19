import type * as Ort from "onnxruntime-web";

// Runs public/models/waste.onnx in the browser. The photo is read into a
// canvas and never uploaded anywhere.

const MODEL_URL = "/models/waste.onnx";
const LABELS_URL = "/models/waste-labels.json";
const SIZE = 224;
// The runtime (JS and the 14 MB .wasm) comes from the CDN, not our bundle.
// Keep the version in sync with onnxruntime-web in package.json (types only).
const ORT_CDN = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/";
const IMPORT_ATTEMPTS = 3;

interface Loaded {
  ort: typeof Ort;
  session: Ort.InferenceSession;
  threshold: number;
}

// The browser remembers a failed import() for that URL, so one dropped
// connection would break the feature until a reload. Each retry uses a new URL.
async function importOrt(): Promise<typeof Ort> {
  let lastError: unknown;
  for (let attempt = 0; attempt < IMPORT_ATTEMPTS; attempt++) {
    const url = `${ORT_CDN}ort.wasm.min.mjs${attempt ? `?retry=${attempt}` : ""}`;
    try {
      return await import(/* webpackIgnore: true */ url);
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw lastError;
}

let loading: Promise<Loaded> | null = null;

export function loadWasteModel(): Promise<Loaded> {
  loading ??= (async () => {
    const ort = await importOrt();
    ort.env.wasm.wasmPaths = ORT_CDN;
    // Threads need cross-origin isolation, which the site doesn't have.
    ort.env.wasm.numThreads = 1;
    const [session, labels] = await Promise.all([
      ort.InferenceSession.create(MODEL_URL, { executionProviders: ["wasm"] }),
      fetch(LABELS_URL).then((r) => r.json() as Promise<{ threshold: number }>),
    ]);
    return { ort, session, threshold: labels.threshold };
  })().catch((err) => {
    loading = null;
    throw err;
  });
  return loading;
}

// Same as the eval transform in ml/dataset.py: shorter side to 224, centre crop.
// Big phone photos are halved first so the last step doesn't alias.
async function toTensorData(file: Blob): Promise<Float32Array> {
  const bitmap = await createImageBitmap(file);
  let source: CanvasImageSource = bitmap;
  let w = bitmap.width;
  let h = bitmap.height;
  while (Math.min(w, h) >= SIZE * 4) {
    const half = document.createElement("canvas");
    half.width = Math.round(w / 2);
    half.height = Math.round(h / 2);
    half.getContext("2d")!.drawImage(source, 0, 0, half.width, half.height);
    source = half;
    w = half.width;
    h = half.height;
  }

  const scale = SIZE / Math.min(w, h);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  // Transparent PNGs would otherwise read as black.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(source, (SIZE - w * scale) / 2, (SIZE - h * scale) / 2, w * scale, h * scale);
  bitmap.close();

  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
  const plane = SIZE * SIZE;
  const out = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    out[i] = data[i * 4] / 255;
    out[plane + i] = data[i * 4 + 1] / 255;
    out[2 * plane + i] = data[i * 4 + 2] / 255;
  }
  return out;
}

export async function classifyPhoto(file: Blob): Promise<{ probs: Float32Array; threshold: number }> {
  const [{ ort, session, threshold }, pixels] = await Promise.all([loadWasteModel(), toTensorData(file)]);
  const input = new ort.Tensor("float32", pixels, [1, 3, SIZE, SIZE]);
  const output = await session.run({ image: input });
  return { probs: output.probs.data as Float32Array, threshold };
}
