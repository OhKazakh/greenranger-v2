"""Export the trained model to ONNX and try an int8 version.

The exported graph takes RGB values in 0..1 (1x3x224x224) and returns class
probabilities, so the browser only resizes and crops. Normalisation and
softmax are inside the graph.

Three versions are compared on the validation set: int8, fp16 weights and
fp32. The smallest one within 1 point of fp32 is copied to public/models.
The test set is not used here.

    python export.py --arch mobilenet_v3_large
"""

import argparse
import json
import shutil
from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort
import torch
from onnx import TensorProto, helper, numpy_helper
from onnxruntime.quantization import CalibrationDataReader, QuantFormat, QuantType, quantize_static
from onnxruntime.quantization.shape_inference import quant_pre_process
from torch import nn
from torchvision import transforms

from classes import CLASSES
from dataset import DATA, IMAGE_SIZE, MEAN, STD, read_split
from train import CHECKPOINTS, build_model

ROOT = Path(__file__).parent
OUT = ROOT / "checkpoints"
PUBLIC = ROOT.parent / "public" / "models"

# Same as dataset.EVAL_TRANSFORM without Normalize: the graph does that.
RAW_TRANSFORM = transforms.Compose([
    transforms.Resize(IMAGE_SIZE),
    transforms.CenterCrop(IMAGE_SIZE),
    transforms.ToTensor(),
])


class Exported(nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model
        self.register_buffer("mean", torch.tensor(MEAN).view(1, 3, 1, 1))
        self.register_buffer("std", torch.tensor(STD).view(1, 3, 1, 1))

    def forward(self, x):
        return torch.softmax(self.model((x - self.mean) / self.std), dim=1)


def load_images(rows):
    from PIL import Image
    for row in rows:
        image = Image.open(DATA / row["path"]).convert("RGB")
        yield RAW_TRANSFORM(image).unsqueeze(0).numpy(), CLASSES.index(row["label"])


def accuracy(path, rows):
    session = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
    name = session.get_inputs()[0].name
    correct = sum(int(session.run(None, {name: x})[0].argmax() == y) for x, y in load_images(rows))
    return correct / len(rows)


class Calibration(CalibrationDataReader):
    def __init__(self, rows, name):
        self.items = ({name: x} for x, _ in load_images(rows))

    def get_next(self):
        return next(self.items, None)


def fp16_weights(src, dst):
    """Store float weights as fp16 and cast them back to fp32 at load time.

    Halves the download; the maths still runs in fp32."""
    model = onnx.load(str(src))
    graph = model.graph
    casts = []
    for init in graph.initializer:
        if init.data_type != TensorProto.FLOAT:
            continue
        half = numpy_helper.from_array(numpy_helper.to_array(init).astype(np.float16), init.name + "_fp16")
        init.CopyFrom(half)
        casts.append(helper.make_node("Cast", [init.name], [init.name[:-5]], to=TensorProto.FLOAT))
    nodes = casts + list(graph.node)
    del graph.node[:]
    graph.node.extend(nodes)
    onnx.checker.check_model(model)
    onnx.save(model, str(dst))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--arch", default="mobilenet_v3_large")
    args = parser.parse_args()

    checkpoint = torch.load(CHECKPOINTS / f"{args.arch}.pt", map_location="cpu")
    model, _ = build_model(checkpoint["arch"], pretrained=False)
    model.load_state_dict(checkpoint["state_dict"])
    exported = Exported(model).eval()

    fp32 = OUT / f"{args.arch}.onnx"
    torch.onnx.export(exported, torch.rand(1, 3, IMAGE_SIZE, IMAGE_SIZE), str(fp32),
                      input_names=["image"], output_names=["probs"], opset_version=17, dynamo=False)

    # The ONNX graph has to agree with PyTorch before anything else.
    sample = torch.rand(4, 1, 3, IMAGE_SIZE, IMAGE_SIZE)
    session = ort.InferenceSession(str(fp32), providers=["CPUExecutionProvider"])
    for x in sample:
        diff = np.abs(session.run(None, {"image": x.numpy()})[0] - exported(x).detach().numpy()).max()
        assert diff < 1e-4, f"onnx output differs from torch by {diff}"

    prepped = OUT / f"{args.arch}-prep.onnx"
    int8 = OUT / f"{args.arch}-int8.onnx"
    quant_pre_process(str(fp32), str(prepped))
    rng = np.random.default_rng(0)
    train_rows = read_split("train")
    calibration = [train_rows[i] for i in rng.choice(len(train_rows), 300, replace=False)]
    quantize_static(str(prepped), str(int8), Calibration(calibration, "image"),
                    quant_format=QuantFormat.QDQ, per_channel=True,
                    activation_type=QuantType.QUInt8, weight_type=QuantType.QInt8)

    half = OUT / f"{args.arch}-fp16w.onnx"
    fp16_weights(fp32, half)

    # Smallest file that stays within 1 point of fp32 on the validation set.
    val_rows = read_split("val")
    candidates = {"int8": int8, "fp16_weights": half, "fp32": fp32}
    accs = {name: accuracy(path, val_rows) for name, path in candidates.items()}
    shipped = next(name for name in candidates if accs["fp32"] - accs[name] <= 0.01)
    chosen = candidates[shipped]
    report = {
        "arch": args.arch,
        "shipped": shipped,
        **{f"val_accuracy_{name}": acc for name, acc in accs.items()},
        **{f"size_mb_{name}": round(path.stat().st_size / 1e6, 2) for name, path in candidates.items()},
    }
    print(json.dumps(report, indent=2))

    PUBLIC.mkdir(parents=True, exist_ok=True)
    shutil.copy(chosen, PUBLIC / "waste.onnx")
    (ROOT / "results").mkdir(exist_ok=True)
    (ROOT / "results" / "export.json").write_text(json.dumps(report, indent=2) + "\n")


if __name__ == "__main__":
    main()
