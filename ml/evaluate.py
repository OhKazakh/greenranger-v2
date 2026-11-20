"""Score the shipped model (public/models/waste.onnx) once on the test set.

The confidence threshold is chosen on the validation set first: the lowest
value where predictions at or above it are at least 98% correct. The app
uses it to decide between showing one answer and asking the user.

Writes results/metrics.json, results/confusion_matrix.png and
public/models/waste-labels.json.
"""

import json
from collections import defaultdict
from pathlib import Path

import matplotlib
import numpy as np
import onnxruntime as ort
from sklearn.metrics import confusion_matrix

from classes import CLASSES
from dataset import read_split
from export import PUBLIC, load_images

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

RESULTS = Path(__file__).parent / "results"
TARGET_PRECISION = 0.98


def predict(session, rows):
    """Run the ONNX session on every row. Returns (probabilities, true class indices) as arrays."""
    probs = np.concatenate([session.run(None, {"image": x})[0] for x, _ in load_images(rows)])
    labels = np.array([CLASSES.index(row["label"]) for row in rows])
    return probs, labels


def pick_threshold(probs, labels):
    """The lowest confidence at which kept answers are at least TARGET_PRECISION correct."""
    confidence, correct = probs.max(1), probs.argmax(1) == labels
    # Raise the threshold step by step until the answers it keeps are right often enough.
    for t in np.arange(0.30, 0.96, 0.01):
        kept = confidence >= t
        if kept.any() and correct[kept].mean() >= TARGET_PRECISION:
            return round(float(t), 2)
    return 0.95


def main():
    """Pick the threshold on val, score the test set once, write metrics, labels and the confusion matrix."""
    session = ort.InferenceSession(str(PUBLIC / "waste.onnx"), providers=["CPUExecutionProvider"])

    val_probs, val_labels = predict(session, read_split("val"))
    threshold = pick_threshold(val_probs, val_labels)

    test_rows = read_split("test")
    probs, labels = predict(session, test_rows)
    predicted = probs.argmax(1)
    correct = predicted == labels
    confident = probs.max(1) >= threshold

    by_source = defaultdict(list)
    for row, ok in zip(test_rows, correct):
        by_source[row["source"]].append(ok)

    matrix = confusion_matrix(labels, predicted, labels=range(len(CLASSES)))
    per_class = {c: float(matrix[i, i] / matrix[i].sum()) for i, c in enumerate(CLASSES)}

    metrics = {
        "test_images": len(test_rows),
        "test_accuracy": float(correct.mean()),
        "test_accuracy_by_source": {s: float(np.mean(v)) for s, v in by_source.items()},
        "test_recall_by_class": per_class,
        "test_top3_accuracy": float(np.mean([l in p.argsort()[-3:] for p, l in zip(probs, labels)])),
        "threshold": threshold,
        "threshold_target_precision": TARGET_PRECISION,
        "test_share_above_threshold": float(confident.mean()),
        "test_accuracy_above_threshold": float(correct[confident].mean()),
    }
    RESULTS.mkdir(exist_ok=True)
    (RESULTS / "metrics.json").write_text(json.dumps(metrics, indent=2) + "\n")
    print(json.dumps(metrics, indent=2))

    (PUBLIC / "waste-labels.json").write_text(
        json.dumps({"classes": CLASSES, "threshold": threshold}, indent=2) + "\n")

    fig, ax = plt.subplots(figsize=(8, 7))
    normalized = matrix / matrix.sum(1, keepdims=True)
    ax.imshow(normalized, cmap="Greens", vmin=0, vmax=1)
    for i in range(len(CLASSES)):
        for j in range(len(CLASSES)):
            if matrix[i, j]:
                ax.text(j, i, matrix[i, j], ha="center", va="center", fontsize=9,
                        color="white" if normalized[i, j] > 0.6 else "black")
    ax.set_xticks(range(len(CLASSES)), CLASSES, rotation=45, ha="right")
    ax.set_yticks(range(len(CLASSES)), CLASSES)
    ax.set_xlabel("predicted")
    ax.set_ylabel("actual")
    ax.set_title(f"Test set, {len(test_rows)} images, accuracy {correct.mean():.1%}")
    fig.tight_layout()
    fig.savefig(RESULTS / "confusion_matrix.png", dpi=150)


if __name__ == "__main__":
    main()
