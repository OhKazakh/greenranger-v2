"""Photo classifier for the "What is this?" section.

Runs the same ONNX model and labels file the website ships (public/models/) with onnxruntime.
Preprocessing matches ml/evaluate.py, so a photo gets the same answer here as in the evaluation.
"""

import json
from pathlib import Path

import numpy as np
import onnxruntime as ort
import streamlit as st
from PIL import Image, ImageOps

MODELS = Path(__file__).resolve().parent.parent / "public" / "models"
MODEL_PATH = MODELS / "waste.onnx"
LABELS_PATH = MODELS / "waste-labels.json"
SIZE = 224

# Model class -> materials on the map. Same table as src/lib/classify.ts on the website.
# An empty list means no point on the map takes it.
CLASS_MATERIALS = {
    "cardboard": ["paper"],
    "paper": ["paper"],
    "plastic": ["plastic"],
    "glass": ["glass"],
    "metal": ["metal"],
    "textile": ["clothes"],
    "food": [],
    "vegetation": [],
    "trash": [],
}

# The model can't tell a PET bottle from a bag, or a can from a pan, so for these two classes the app asks.
# A drink bottle or can also goes to the bottle machines (fandomats), which the map calls "bottles".
DRINK_MATERIALS = {
    "plastic": ["bottles"],
    "metal": ["aluminium", "bottles"],
}


@st.cache_resource(show_spinner=False)
def load_model():
    """Load the ONNX session, the class names and the confidence threshold once per server."""
    labels = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
    session = ort.InferenceSession(str(MODEL_PATH), providers=["CPUExecutionProvider"])
    return session, labels["classes"], labels["threshold"]


def open_photo(file):
    """Open an uploaded or camera photo, turned upright by its EXIF orientation tag."""
    # Phone cameras often save a rotation tag instead of rotating the pixels. The dataset photos have
    # no such tag, so this changes nothing for them and the results still match ml/evaluate.py.
    return ImageOps.exif_transpose(Image.open(file))


def preprocess(image):
    """Turn a PIL image into the model's input: a 1x3x224x224 float array with values 0..1.

    Same steps as RAW_TRANSFORM in ml/export.py, which ml/evaluate.py uses: shorter side to 224
    (bilinear), centre crop to 224x224, RGB scaled to 0..1. The normalisation is inside the ONNX graph.
    """
    image = image.convert("RGB")
    width, height = image.size
    # torchvision's Resize(224) makes the shorter side 224 and truncates the longer one with int().
    if width <= height:
        new_size = (SIZE, int(SIZE * height / width))
    else:
        new_size = (int(SIZE * width / height), SIZE)
    image = image.resize(new_size, Image.BILINEAR)
    # CenterCrop(224) rounds the offsets the same way torchvision does.
    left = int(round((new_size[0] - SIZE) / 2.0))
    top = int(round((new_size[1] - SIZE) / 2.0))
    image = image.crop((left, top, left + SIZE, top + SIZE))
    pixels = np.asarray(image, dtype=np.float32) / 255.0
    return pixels.transpose(2, 0, 1)[np.newaxis]  # height, width, channel -> 1, channel, height, width


def classify(image):
    """Run the model on a PIL image. Returns [(class, probability), ...], most likely first."""
    session, classes, _ = load_model()
    probs = session.run(None, {"image": preprocess(image)})[0][0]
    order = np.argsort(probs)[::-1]
    return [(classes[i], float(probs[i])) for i in order]


def threshold():
    """The confidence below which the app asks the user instead of answering (0.71)."""
    return load_model()[2]


def decide(ranked, limit):
    """Return ("confident", [top answer]) at or above the limit, otherwise ("unsure", top three).

    Below the limit the app never picks for the user, so the map is never filtered on a guess.
    """
    if ranked[0][1] >= limit:
        return "confident", ranked[:1]
    return "unsure", ranked[:3]


def asks_drink(cls):
    """True for the classes where a drink bottle or can goes to more points (plastic, metal)."""
    return cls in DRINK_MATERIALS


def materials_for(cls, drink=False):
    """The map materials for a model class. drink=True adds the bottle machines."""
    extra = DRINK_MATERIALS.get(cls, []) if drink else []
    return CLASS_MATERIALS[cls] + extra
