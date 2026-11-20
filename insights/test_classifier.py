"""Tests for the class-to-material rules in classifier.py. Run: .venv/bin/python -m pytest"""

import json

from classifier import CLASS_MATERIALS, DRINK_MATERIALS, LABELS_PATH, asks_drink, decide, materials_for
from i18n import MATERIALS, TEXT


def test_mapping_covers_the_model_classes():
    """Every class in the shipped labels file has a mapping, and nothing else does."""
    classes = json.loads(LABELS_PATH.read_text(encoding="utf-8"))["classes"]
    assert sorted(CLASS_MATERIALS) == sorted(classes)


def test_only_known_materials():
    """Every mapped material is one the map can filter on."""
    for cls in CLASS_MATERIALS:
        for material in materials_for(cls) + materials_for(cls, drink=True):
            assert material in MATERIALS


def test_no_point_takes_food_plants_or_trash():
    """Food, plants and mixed trash never filter the map."""
    for cls in ("food", "vegetation", "trash"):
        assert materials_for(cls) == [] and materials_for(cls, drink=True) == []


def test_drink_question_only_for_plastic_and_metal():
    """Only plastic and metal ask about drink bottles, and a yes adds the bottle machines."""
    assert sorted(DRINK_MATERIALS) == ["metal", "plastic"]
    assert materials_for("plastic", drink=True) == ["plastic", "bottles"]
    assert materials_for("metal", drink=True) == ["metal", "aluminium", "bottles"]
    assert not asks_drink("glass")


def test_below_the_threshold_it_never_picks_one():
    """Under the threshold the result is the top three, never a single answer."""
    ranked = [("glass", 0.50), ("plastic", 0.33), ("textile", 0.04), ("paper", 0.03)]
    assert decide(ranked, 0.71) == ("unsure", ranked[:3])
    assert decide([("plastic", 0.89)] + ranked[1:], 0.71) == ("confident", [("plastic", 0.89)])


def test_every_class_has_a_name_in_every_language():
    """The app can name each class in English, Russian and Kazakh."""
    for strings in TEXT.values():
        for cls in CLASS_MATERIALS:
            assert strings[f"class_{cls}"]
