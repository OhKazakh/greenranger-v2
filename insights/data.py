import json
from pathlib import Path

import pandas as pd
import requests
import streamlit as st

from i18n import t

API_URL = "https://api.greenranger.kz/api/locations"
SNAPSHOT_PATH = Path(__file__).resolve().parent.parent / "backend" / "prisma" / "locations.json"

COLUMNS = {
    "slug": "slug",
    "category": "category",
    "nameRu": "name_ru",
    "nameEn": "name_en",
    "nameKk": "name_kk",
    "addressRu": "address_ru",
    "addressEn": "address_en",
    "addressKk": "address_kk",
    "lat": "lat",
    "lng": "lng",
    "materials": "materials",
    "scheduleWeekdays": "weekdays",
    "scheduleSaturday": "saturday",
    "scheduleSunday": "sunday",
    "phone": "phone",
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


def locations_with_notice():
    with st.spinner(t("loading")):
        table, source = load_locations()

    if source == "live":
        st.caption(t("data_live", count=len(table)))
    else:
        message, button = st.columns([5, 1], vertical_alignment="center")
        message.warning(t("data_snapshot", count=len(table)))
        if button.button(t("retry_live")):
            load_locations.clear()
            st.rerun()

    return table


def points_accepting(table, materials, match_all=False):
    if not materials:
        return table

    wanted = set(materials)
    if match_all:
        keep = table["materials"].apply(lambda accepted: wanted <= set(accepted))
    else:
        keep = table["materials"].apply(lambda accepted: bool(wanted & set(accepted)))
    return table[keep]
