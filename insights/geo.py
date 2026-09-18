import numpy as np

EARTH_RADIUS_KM = 6371.0

CITY_CENTER = (51.1282, 71.4306)
CITY_BOUNDS = {"south": 50.95, "north": 51.32, "west": 71.15, "east": 71.65}


def haversine_km(lat1, lng1, lat2, lng2):
    lat1, lng1, lat2, lng2 = (np.radians(value) for value in (lat1, lng1, lat2, lng2))
    h = (
        np.sin((lat2 - lat1) / 2) ** 2
        + np.cos(lat1) * np.cos(lat2) * np.sin((lng2 - lng1) / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * np.arcsin(np.sqrt(h))


def directions_url(origin, lat, lng):
    return (
        "https://www.google.com/maps/dir/?api=1"
        f"&origin={origin[0]},{origin[1]}&destination={lat},{lng}"
    )
