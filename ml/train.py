"""Fine-tune an ImageNet model on the waste classes.

Stage 1 trains only the new last layer, stage 2 unfreezes everything.
The checkpoint with the best validation accuracy is kept; the test set is
not touched here.

    python train.py --arch mobilenet_v3_large
"""

import argparse
import json
import time
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader
from torchvision import models

from classes import CLASSES
from dataset import EVAL_TRANSFORM, TRAIN_TRANSFORM, WasteImages

CHECKPOINTS = Path(__file__).parent / "checkpoints"


def build_model(arch, pretrained=True):
    if arch == "mobilenet_v3_large":
        weights = models.MobileNet_V3_Large_Weights.IMAGENET1K_V2 if pretrained else None
        model = models.mobilenet_v3_large(weights=weights)
        model.classifier[3] = nn.Linear(model.classifier[3].in_features, len(CLASSES))
        head = model.classifier
    elif arch == "efficientnet_b0":
        weights = models.EfficientNet_B0_Weights.IMAGENET1K_V1 if pretrained else None
        model = models.efficientnet_b0(weights=weights)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, len(CLASSES))
        head = model.classifier
    else:
        raise ValueError(arch)
    return model, head


def run_epoch(model, loader, device, loss_fn, optimizer=None, scheduler=None):
    training = optimizer is not None
    model.train(training)
    total, correct, loss_sum = 0, 0, 0.0
    with torch.set_grad_enabled(training):
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            logits = model(images)
            loss = loss_fn(logits, labels)
            if training:
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                scheduler.step()
            total += labels.size(0)
            correct += (logits.argmax(1) == labels).sum().item()
            loss_sum += loss.item() * labels.size(0)
    return loss_sum / total, correct / total


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--arch", default="mobilenet_v3_large")
    parser.add_argument("--head-epochs", type=int, default=3)
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batch", type=int, default=64)
    args = parser.parse_args()

    torch.manual_seed(42)
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    model, head = build_model(args.arch)
    model.to(device)

    train_loader = DataLoader(WasteImages("train", TRAIN_TRANSFORM), batch_size=args.batch,
                              shuffle=True, num_workers=6, persistent_workers=True)
    val_loader = DataLoader(WasteImages("val", EVAL_TRANSFORM), batch_size=args.batch,
                            num_workers=4, persistent_workers=True)
    loss_fn = nn.CrossEntropyLoss(label_smoothing=0.1)

    stages = [
        ("head", args.head_epochs, head.parameters(), 1e-3),
        ("full", args.epochs, model.parameters(), 3e-4),
    ]
    CHECKPOINTS.mkdir(exist_ok=True)
    best_path = CHECKPOINTS / f"{args.arch}.pt"
    best_acc, history = 0.0, []

    for stage, epochs, params, lr in stages:
        for p in model.parameters():
            p.requires_grad = stage == "full"
        for p in head.parameters():
            p.requires_grad = True

        optimizer = torch.optim.AdamW([p for p in params if p.requires_grad], lr=lr, weight_decay=1e-4)
        scheduler = torch.optim.lr_scheduler.OneCycleLR(
            optimizer, max_lr=lr, total_steps=epochs * len(train_loader), pct_start=0.15)

        for epoch in range(1, epochs + 1):
            start = time.time()
            train_loss, train_acc = run_epoch(model, train_loader, device, loss_fn, optimizer, scheduler)
            val_loss, val_acc = run_epoch(model, val_loader, device, loss_fn)
            history.append({"stage": stage, "epoch": epoch, "train_acc": train_acc, "val_acc": val_acc,
                            "train_loss": train_loss, "val_loss": val_loss})
            marker = ""
            if val_acc > best_acc:
                best_acc = val_acc
                torch.save({"arch": args.arch, "state_dict": model.state_dict()}, best_path)
                marker = " *"
            print(f"{stage} {epoch}/{epochs}  train {train_acc:.3f}  val {val_acc:.3f}"
                  f"  ({time.time() - start:.0f}s){marker}", flush=True)

    (CHECKPOINTS / f"{args.arch}-history.json").write_text(json.dumps(history, indent=2))
    print(f"best val accuracy {best_acc:.4f} -> {best_path}")


if __name__ == "__main__":
    main()
