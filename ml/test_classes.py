from classes import CLASSES, REALWASTE, TRASHNET


def test_every_source_folder_maps_to_a_class():
    for label in [*REALWASTE.values(), *TRASHNET.values()]:
        assert label in CLASSES


def test_every_class_has_training_data():
    used = set(REALWASTE.values()) | set(TRASHNET.values())
    assert used == set(CLASSES)


def test_class_names_are_unique():
    assert len(CLASSES) == len(set(CLASSES))
