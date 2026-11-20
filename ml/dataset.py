import csv
from pathlib import Path

from PIL import Image
from torch.utils.data import Dataset
from torchvision import transforms

from classes import CLASSES

DATA = Path(__file__).parent / "data"
IMAGE_SIZE = 224
MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]

# Eval and the browser both do: shorter side to 224, then a centre crop.
EVAL_TRANSFORM = transforms.Compose([
    transforms.Resize(IMAGE_SIZE),
    transforms.CenterCrop(IMAGE_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(MEAN, STD),
])

TRAIN_TRANSFORM = transforms.Compose([
    transforms.RandomResizedCrop(IMAGE_SIZE, scale=(0.5, 1.0)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.RandomRotation(20),
    transforms.ColorJitter(0.3, 0.3, 0.3, 0.05),
    transforms.ToTensor(),
    transforms.Normalize(MEAN, STD),
])


def read_split(name):
    """The rows of data/splits.csv for one split: train, val or test."""
    with open(DATA / "splits.csv") as f:
        return [row for row in csv.DictReader(f) if row["split"] == name]


class WasteImages(Dataset):
    """A PyTorch dataset of one split: (image tensor, class index) pairs."""
    def __init__(self, split, transform):
        """Read the split's rows and keep the transform to apply to each image."""
        self.rows = read_split(split)
        self.transform = transform

    def __len__(self):
        """Number of images in the split."""
        return len(self.rows)

    def __getitem__(self, i):
        """Load image i as RGB, transform it, and return it with its class index."""
        row = self.rows[i]
        image = Image.open(DATA / row["path"]).convert("RGB")
        return self.transform(image), CLASSES.index(row["label"])
