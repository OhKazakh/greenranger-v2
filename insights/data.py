import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd
import requests
import streamlit as st

from geo import CITY_BOUNDS

API_URL = "https://api.greenranger.kz/api/locations"
SNAPSHOT_PATH = Path(__file__).resolve().parent.parent / "backend" / "prisma" / "locations.json"
ASTANA_TIME = timezone(timedelta(hours=5))
HOURS_PATTERN = re.compile(r"(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})")

COLUMNS = {
    "slug": "slug",
    "category": "category",
    "nameRu": "name_ru",
    "nameEn": "name_en",
    "nameKk": "name_kk",
    "lat": "lat",
    "lng": "lng",
    "materials": "materials",
    "scheduleWeekdays": "weekdays",
    "scheduleSaturday": "saturday",
    "scheduleSunday": "sunday",
}


@st.cache_data(ttl=3600, show_spinner=False)
def load_locations():
    try:
        response = requests.get(API_URL, timeout=90)
        response.raise_for_status()
        records = response.json()
        source = "live"
    except (requests.RequestException, ValueError):
        records = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
        source = "snapshot"

    table = pd.DataFrame(records)[list(COLUMNS)].rename(columns=COLUMNS)
    table = table.astype({"lat": float, "lng": float})
    return table, source


@st.cache_data(ttl=86400, show_spinner=False)
def geocode(address, lang):
    viewbox = f"{CITY_BOUNDS['west']},{CITY_BOUNDS['north']},{CITY_BOUNDS['east']},{CITY_BOUNDS['south']}"
    response = requests.get(
        "https://nominatim.openstreetmap.org/search",
        params={
            "q": address,
            "format": "json",
            "limit": 1,
            "countrycodes": "kz",
            "viewbox": viewbox,
            "bounded": 1,
            "accept-language": lang,
        },
        headers={"User-Agent": "greenranger-insights (https://greenranger.kz)"},
        timeout=15,
    )
    response.raise_for_status()
    results = response.json()
    if not results:
        return None
    return float(results[0]["lat"]), float(results[0]["lon"])


def filter_points(table, category, materials):
    keep = pd.Series(True, index=table.index)
    if category != "all":
        keep &= table["category"] == category
    if materials:
        wanted = set(materials)
        keep &= table["materials"].apply(lambda accepted: bool(wanted & set(accepted)))
    return table[keep]


def astana_now():
    return datetime.now(ASTANA_TIME)


def todays_hours(point, now):
    if now.weekday() < 5:
        hours = point["weekdays"]
    elif now.weekday() == 5:
        hours = point["saturday"]
    else:
        hours = point["sunday"]
    return None if pd.isna(hours) else hours


def open_status(point, now):
    if all(pd.isna(point[day]) for day in ("weekdays", "saturday", "sunday")):
        return "unknown"

    hours = todays_hours(point, now)
    if hours is None:
        return "closed"

    match = HOURS_PATTERN.search(hours)
    if match is None:
        return "unknown"

    open_h, open_m, close_h, close_m = (int(part) for part in match.groups())
    minutes_now = now.hour * 60 + now.minute
    if open_h * 60 + open_m <= minutes_now < close_h * 60 + close_m:
        return "open"
    return "closed"
