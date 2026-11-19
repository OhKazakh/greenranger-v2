"""Index both datasets and split them 70/15/15 into train, val and test.

The split is stratified by source and class with a fixed seed, so every run
gets the same test set. Output: data/splits.csv (path, source, label, split).
"""

import csv
import random
from collections import defaultdict
from pathlib import Path

from classes import REALWASTE, TRASHNET

DATA = Path(__file__).parent / "data"
SEED = 42
IMAGE_EXT = {".jpg", ".jpeg", ".png"}


def index(root, folders, source):
    rows = []
    for folder, label in folders.items():
        directory = root / folder
        if not directory.is_dir():
            raise SystemExit(f"missing folder: {directory}")
        for path in sorted(directory.iterdir()):
            if path.suffix.lower() in IMAGE_EXT:
                rows.append({"path": str(path.relative_to(DATA)), "source": source, "label": label})
    return rows


def split(rows):
    groups = defaultdict(list)
    for row in rows:
        groups[(row["source"], row["label"])].append(row)

    rng = random.Random(SEED)
    for group in groups.values():
        rng.shuffle(group)
        n_test = round(len(group) * 0.15)
        n_val = round(len(group) * 0.15)
        for i, row in enumerate(group):
            row["split"] = "test" if i < n_test else "val" if i < n_test + n_val else "train"
    return rows


def main():
    rows = index(DATA / "realwaste" / "realwaste-main" / "RealWaste", REALWASTE, "realwaste")
    rows += index(DATA / "trashnet" / "dataset-resized", TRASHNET, "trashnet")
    rows = split(rows)

    with open(DATA / "splits.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["path", "source", "label", "split"])
        writer.writeheader()
        writer.writerows(rows)

    counts = defaultdict(int)
    for row in rows:
        counts[row["split"]] += 1
    print(f"{len(rows)} images: {dict(counts)}")


if __name__ == "__main__":
    main()
