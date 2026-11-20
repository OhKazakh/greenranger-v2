"""Check that the Streamlit app's classifier (insights/classifier.py) agrees with ml/evaluate.py.

Takes 10 photos from the test split (a fixed seed, at least one per class), runs each through
evaluate.py's own pipeline and through the app's, and compares the top class and the probabilities.

    .venv/bin/python check_streamlit.py      # needs requirements.txt plus streamlit
"""

import random
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort

from classes import CLASSES
from dataset import DATA, read_split
from evaluate import predict
from export import PUBLIC

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "insights"))
import classifier  # noqa: E402  (the app's module, imported from insights/)

N = 10


def pick_photos():
    """10 test photos: one per class first, then random ones, always the same with seed 7."""
    rows = read_split("test")
    rng = random.Random(7)
    rng.shuffle(rows)
    picked = [next(r for r in rows if r["label"] == c) for c in CLASSES]
    return (picked + [r for r in rows if r not in picked])[:N]


def main():
    """Print one line per photo and exit with an error if any top class differs."""
    rows = pick_photos()
    session = ort.InferenceSession(str(PUBLIC / "waste.onnx"), providers=["CPUExecutionProvider"])
    reference, _ = predict(session, rows)  # exactly what evaluate.py computes for these photos

    failures = 0
    for row, ref in zip(rows, reference):
        ranked = classifier.classify(classifier.open_photo(DATA / row["path"]))
        app = np.array([dict(ranked)[c] for c in CLASSES])
        same = CLASSES[int(ref.argmax())] == ranked[0][0]
        failures += not same
        print(f"{'OK  ' if same else 'DIFF'} {row['path'].split('/')[-1]:28} label {row['label']:10} "
              f"evaluate {CLASSES[int(ref.argmax())]:10} {ref.max():.4f}  app {ranked[0][0]:10} {ranked[0][1]:.4f}  "
              f"max diff {np.abs(app - ref).max():.6f}")
    print(f"{N - failures}/{N} photos give the same top class")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
