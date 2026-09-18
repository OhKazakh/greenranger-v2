import numpy as np
import pandas as pd

EARTH_RADIUS_KM = 6371.0
METERS_PER_DEGREE = 111_320

CITY_CENTER = (51.1282, 71.4306)
CITY_BOUNDS = {"south": 51.06, "north": 51.24, "west": 71.32, "east": 71.60}


def haversine_km(lat1, lng1, lat2, lng2):
    lat1, lng1, lat2, lng2 = (np.radians(value) for value in (lat1, lng1, lat2, lng2))
    h = (
        np.sin((lat2 - lat1) / 2) ** 2
        + np.cos(lat1) * np.cos(lat2) * np.sin((lng2 - lng1) / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * np.arcsin(np.sqrt(h))


def make_grid(cell_m):
    lat_step = cell_m / METERS_PER_DEGREE
    middle_lat = (CITY_BOUNDS["south"] + CITY_BOUNDS["north"]) / 2
    lng_step = cell_m / (METERS_PER_DEGREE * np.cos(np.radians(middle_lat)))

    lats = np.arange(CITY_BOUNDS["south"] + lat_step / 2, CITY_BOUNDS["north"], lat_step)
    lngs = np.arange(CITY_BOUNDS["west"] + lng_step / 2, CITY_BOUNDS["east"], lng_step)
    grid_lat, grid_lng = np.meshgrid(lats, lngs, indexing="ij")
    grid = pd.DataFrame({"lat": grid_lat.ravel(), "lng": grid_lng.ravel()})

    half_lat, half_lng = lat_step / 2, lng_step / 2
    grid["polygon"] = [
        [
            [lng - half_lng, lat - half_lat],
            [lng + half_lng, lat - half_lat],
            [lng + half_lng, lat + half_lat],
            [lng - half_lng, lat + half_lat],
        ]
        for lat, lng in zip(grid["lat"], grid["lng"])
    ]
    return grid


def nearest_km(from_lat, from_lng, to_lat, to_lng):
    if len(to_lat) == 0:
        return np.full(len(from_lat), np.inf)

    distances = haversine_km(
        np.asarray(from_lat)[:, None],
        np.asarray(from_lng)[:, None],
        np.asarray(to_lat)[None, :],
        np.asarray(to_lng)[None, :],
    )
    return distances.min(axis=1)
