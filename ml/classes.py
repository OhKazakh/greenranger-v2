# Model classes, in output order. The web app maps each one to map materials
# in src/lib/classify.ts, and a test there checks the two lists match.
CLASSES = [
    "cardboard",
    "paper",
    "plastic",
    "glass",
    "metal",
    "textile",
    "food",
    "vegetation",
    "trash",
]

# Source folder name -> our class.
REALWASTE = {
    "Cardboard": "cardboard",
    "Food Organics": "food",
    "Glass": "glass",
    "Metal": "metal",
    "Miscellaneous Trash": "trash",
    "Paper": "paper",
    "Plastic": "plastic",
    "Textile Trash": "textile",
    "Vegetation": "vegetation",
}

TRASHNET = {
    "cardboard": "cardboard",
    "glass": "glass",
    "metal": "metal",
    "paper": "paper",
    "plastic": "plastic",
    "trash": "trash",
}
