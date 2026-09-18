import re
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import folium
import pandas as pd
import requests
import streamlit as st
from streamlit_folium import st_folium

from data import locations_with_notice, points_accepting
from geo import CITY_BOUNDS, CITY_CENTER, haversine_km
from i18n import MATERIALS, current_language, material_label, t

ASTANA_TIME = timezone(timedelta(hours=5))
HOURS_PATTERN = re.compile(r"(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})")
STATUS_COLORS = {"open": "green", "closed": "red", "unknown": "gray"}


@st.cache_data(ttl=86400, show_spinner=False)
def geocode(address):
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
        },
        headers={"User-Agent": "greenranger-insights (https://greenranger.kz)"},
        timeout=15,
    )
    response.raise_for_status()
    results = response.json()
    if not results:
        return None
    return float(results[0]["lat"]), float(results[0]["lon"])


def todays_hours(point, now):
    if now.weekday() < 5:
        return point["weekdays"]
    if now.weekday() == 5:
        return point["saturday"]
    return point["sunday"]


def open_status(point, now):
    if all(pd.isna(point[day]) for day in ("weekdays", "saturday", "sunday")):
        return "unknown"

    hours = todays_hours(point, now)
    if pd.isna(hours):
        return "closed"

    match = HOURS_PATTERN.search(hours)
    if match is None:
        return "unknown"

    open_h, open_m, close_h, close_m = (int(part) for part in match.groups())
    minutes_now = now.hour * 60 + now.minute
    if open_h * 60 + open_m <= minutes_now < close_h * 60 + close_m:
        return "open"
    return "closed"


def build_map(origin, nearest, lang):
    fmap = folium.Map(
        location=origin or CITY_CENTER,
        zoom_start=12,
        tiles="OpenStreetMap",
        scrollWheelZoom=False,
    )

    if origin:
        folium.Marker(
            origin,
            tooltip=t("you_are_here"),
            icon=folium.Icon(color="red", icon="user", prefix="fa"),
        ).add_to(fmap)

    for rank, (_, point) in enumerate(nearest.iterrows(), start=1):
        folium.Marker(
            [point["lat"], point["lng"]],
            tooltip=f"{rank}. {point[f'name_{lang}']}",
            icon=folium.Icon(color="green", icon="recycle", prefix="fa"),
        ).add_to(fmap)

    if origin and not nearest.empty:
        fmap.fit_bounds([origin, *zip(nearest["lat"], nearest["lng"])], padding=(40, 40))

    return fmap


def result_card(rank, point, origin, now, lang):
    status = open_status(point, now)
    hours = todays_hours(point, now)

    with st.container(border=True):
        st.markdown(f"**{rank}. {point[f'name_{lang}']}**")
        st.caption(point[f"address_{lang}"])

        km_text = t("km", km=f"{point['distance_km']:.1f}")
        distance, badge = st.columns([1, 2], vertical_alignment="center")
        distance.markdown(f"**{km_text}**")
        with badge:
            st.badge(t(f"status_{status}"), color=STATUS_COLORS[status])
            if pd.notna(hours):
                st.caption(hours)

        if pd.notna(point["phone"]):
            dial = re.sub(r"[^\d+]", "", point["phone"])
            st.markdown(f"[{point['phone']}](tel:{dial})")

        directions = "https://www.google.com/maps/dir/?" + urlencode({
            "api": 1,
            "origin": f"{origin[0]},{origin[1]}",
            "destination": f"{point['lat']},{point['lng']}",
        })
        details_button, directions_button = st.columns(2)
        details_button.link_button(t("details"), f"https://greenranger.kz/locations/{point['slug']}", width="stretch")
        directions_button.link_button(t("directions"), directions, width="stretch")


lang = current_language()
st.title(t("nav_finder"))
table = locations_with_notice()

st.session_state.setdefault("origin", None)
st.session_state.setdefault("seen_click", None)

wanted = st.sidebar.multiselect(
    t("find_materials"),
    list(MATERIALS),
    format_func=material_label,
    placeholder=t("any_material"),
)
mode = st.sidebar.radio(
    t("find_match"),
    ["any", "all"],
    format_func=lambda option: t(f"match_{option}"),
)
count = st.sidebar.slider(t("find_count"), 3, 10, 3)

st.caption(t("find_how"))
with st.form("address_search", border=False):
    field, submit = st.columns([5, 1], vertical_alignment="bottom")
    address = field.text_input(t("find_search"))
    searched = submit.form_submit_button(t("find_search_button"), width="stretch")

if searched and address.strip():
    try:
        found = geocode(address.strip())
    except requests.RequestException:
        found = None
    if found:
        st.session_state["origin"] = found
    else:
        st.warning(t("find_not_found"))

origin = st.session_state["origin"]
nearest = table.iloc[0:0]
if origin:
    matches = points_accepting(table, wanted, match_all=(mode == "all"))
    if not matches.empty:
        distances = haversine_km(origin[0], origin[1], matches["lat"].to_numpy(), matches["lng"].to_numpy())
        nearest = matches.assign(distance_km=distances).nsmallest(count, "distance_km")

map_column, list_column = st.columns([4, 3])

with map_column:
    click = st_folium(
        build_map(origin, nearest, lang),
        height=560,
        use_container_width=True,
        returned_objects=["last_clicked"],
        key="finder_map",
    )

clicked = (click or {}).get("last_clicked")
if clicked and clicked != st.session_state["seen_click"]:
    st.session_state["seen_click"] = clicked
    st.session_state["origin"] = (clicked["lat"], clicked["lng"])
    st.rerun()

with list_column:
    if origin is None:
        st.info(t("find_waiting"))
    elif nearest.empty:
        st.warning(t("find_none"))
    else:
        now = datetime.now(ASTANA_TIME)
        for rank, (_, point) in enumerate(nearest.iterrows(), start=1):
            result_card(rank, point, origin, now, lang)
