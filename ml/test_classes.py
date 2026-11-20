from classes import CLASSES, REALWASTE, TRASHNET


def test_every_source_folder_maps_to_a_class():
    """Every dataset folder maps to one of our classes."""
    for label in [*REALWASTE.values(), *TRASHNET.values()]:
        assert label in CLASSES


def test_every_class_has_training_data():
    """Every class gets photos from at least one dataset."""
    used = set(REALWASTE.values()) | set(TRASHNET.values())
    assert used == set(CLASSES)


def test_class_names_are_unique():
    """No class name appears twice."""
    assert len(CLASSES) == len(set(CLASSES))
