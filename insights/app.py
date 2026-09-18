from base64 import b64encode
from html import escape

import requests
import streamlit as st

from data import astana_now, filter_points, geocode, load_locations, open_status, todays_hours
from geo import CITY_CENTER, directions_url, haversine_km
from i18n import LANGUAGES, MATERIALS, current_language, format_distance, material_label, t
from map_view import map_view

MAP_HEIGHT = 640
NEAREST_COUNT = 3

LEAF = (
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2ec4b6" stroke-width="2" '
    'stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2'
    'c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>'
)
ARROW = (
    '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
    'stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>'
)


def svg_image(svg, size):
    encoded = b64encode(svg.encode()).decode()
    return f'<img src="data:image/svg+xml;base64,{encoded}" width="{size}" height="{size}" alt="">'


LEAF_IMG = svg_image(LEAF, 16)
ARROW_IMG = svg_image(ARROW.replace("currentColor", "#8ba090"), 12)

STYLES = """
<style>
[data-testid="stHeader"] { display: none; }
[data-testid="stMainBlockContainer"] { padding-top: 1.1rem; padding-bottom: 1.5rem; max-width: 1440px; }
[data-testid="InputInstructions"] { display: none; }
.gr-brand { display: flex; align-items: center; gap: 10px; }
.gr-brand a { display: flex; align-items: center; gap: 9px; text-decoration: none; color: #eef5f0; }
.gr-logo { width: 30px; height: 30px; border-radius: 8px; background: #1b4332;
           display: flex; align-items: center; justify-content: center; }
.gr-name { font-family: "Space Grotesk", sans-serif; font-weight: 700; font-size: 17px; }
.gr-sep { width: 1px; height: 18px; background: rgba(255,255,255,0.12); }
.gr-page { color: #2ec4b6; font-size: 14px; font-weight: 500; }
.gr-label { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
            color: #8ba090; margin: 2px 0 6px; }
.gr-muted { font-size: 13px; color: #8ba090; line-height: 1.5; }
.gr-tiny { font-size: 11px; color: rgba(139,160,144,0.7); margin-top: -6px; }
.gr-cards { display: flex; flex-direction: column; gap: 8px; }
.gr-card { border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 11px 12px;
           display: flex; justify-content: space-between; gap: 10px; transition: border-color .15s, background .15s; }
.gr-card:hover { border-color: rgba(46,196,182,0.4); background: rgba(39,39,64,0.4); }
.gr-card-name { font-size: 14px; font-weight: 600; color: #eef5f0; text-decoration: none; line-height: 1.35; }
.gr-card-name:hover { color: #2ec4b6; }
.gr-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 7px; margin-top: 7px; }
.gr-badge { font-size: 11.5px; font-weight: 500; padding: 2px 7px; border-radius: 5px; }
.gr-open { background: rgba(46,196,182,0.1); color: #2ec4b6; }
.gr-closed { background: rgba(239,68,68,0.1); color: #ef4444; }
.gr-unknown { background: #272740; color: #8ba090; }
.gr-hours { font-size: 11.5px; color: #8ba090; }
.gr-side { display: flex; flex-direction: column; align-items: flex-end; gap: 7px; flex-shrink: 0; }
.gr-dist { font-size: 13.5px; font-weight: 600; color: #2ec4b6; }
.gr-dir { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #8ba090; text-decoration: none; }
.gr-dir:hover { color: #2ec4b6; }
</style>
"""


def brand_html():
    return (
        '<div class="gr-brand">'
        f'<a href="https://greenranger.kz" target="_blank"><span class="gr-logo">{LEAF_IMG}</span>'
        '<span class="gr-name">GreenRanger</span></a>'
        f'<span class="gr-sep"></span><span class="gr-page">{escape(t("page"))}</span>'
        "</div>"
    )


def card_html(rank, point, origin, now, lang):
    status = open_status(point, now)
    hours = todays_hours(point, now)
    name = escape(point[f"name_{lang}"])
    details = f"https://greenranger.kz/locations/{point['slug']}"
    route = directions_url(origin, point["lat"], point["lng"])
    hours_html = f'<span class="gr-hours">{escape(hours)}</span>' if hours else ""
    return (
        '<div class="gr-card"><div>'
        f'<a class="gr-card-name" href="{details}" target="_blank">{rank}. {name}</a>'
        f'<div class="gr-meta"><span class="gr-badge gr-{status}">{t("status_" + status)}</span>{hours_html}</div>'
        '</div><div class="gr-side">'
        f'<span class="gr-dist">{format_distance(point["distance_km"])}</span>'
        f'<a class="gr-dir" href="{route}" target="_blank">{ARROW_IMG}{t("directions")}</a>'
        "</div></div>"
    )


st.set_page_config(page_title="GreenRanger — Astana", page_icon="♻️", layout="wide")
st.html(STYLES)

st.session_state.setdefault("origin", None)

brand, switch = st.columns([3, 1], vertical_alignment="center")
with switch:
    st.segmented_control(
        "lang",
        list(LANGUAGES),
        format_func=LANGUAGES.get,
        default="ru",
        required=True,
        key="lang",
        label_visibility="collapsed",
        width="stretch",
    )
with brand:
    st.html(brand_html())

lang = current_language()
with st.spinner(t("loading")):
    table, source = load_locations()

category = st.session_state.get("category") or "all"
materials = st.session_state.get("materials") or []
shown = filter_points(table, category, materials)

panel, map_column = st.columns([1.15, 2.2], gap="medium")

with panel, st.container(border=True, height=MAP_HEIGHT):
    title, clear = st.columns([2, 1.3], vertical_alignment="center")
    title.html(f'<div class="gr-label">{escape(t("title"))}</div>')
    if st.session_state["origin"] and clear.button(t("clear"), type="tertiary", icon=":material/close:"):
        st.session_state["origin"] = None
        st.rerun()

    with st.form("search", border=False):
        field, submit = st.columns([5, 1], vertical_alignment="bottom", gap="small")
        address = field.text_input(t("search"), placeholder=t("address_placeholder"), label_visibility="collapsed")
        searched = submit.form_submit_button("", icon=":material/search:", type="primary", help=t("search"), width="stretch")
    st.html(f'<div class="gr-tiny">{escape(t("attribution"))}</div>')

    if searched and address.strip():
        try:
            found = geocode(address.strip(), lang)
        except requests.RequestException:
            st.toast(t("search_failed"))
        else:
            if found:
                st.session_state["origin"] = found
            else:
                st.toast(t("not_found"))

    origin = st.session_state["origin"]
    nearest = shown.iloc[0:0]
    if origin and not shown.empty:
        distances = haversine_km(origin[0], origin[1], shown["lat"].to_numpy(), shown["lng"].to_numpy())
        nearest = shown.assign(distance_km=distances).nsmallest(NEAREST_COUNT, "distance_km")

    if origin is None:
        st.html(f'<div class="gr-muted">{escape(t("hint"))}</div>')
    elif nearest.empty:
        st.html(f'<div class="gr-muted">{escape(t("no_results"))}</div>')
    else:
        now = astana_now()
        cards = [card_html(rank, point, origin, now, lang) for rank, (_, point) in enumerate(nearest.iterrows(), start=1)]
        st.html('<div class="gr-cards">' + "".join(cards) + "</div>")

    st.divider()

    st.html(f'<div class="gr-label">{escape(t("type"))}</div>')
    st.segmented_control(
        t("type"),
        ["all", "hub", "kiosk"],
        format_func=lambda option: t(f"type_{option}"),
        default="all",
        required=True,
        key="category",
        label_visibility="collapsed",
    )

    st.html(f'<div class="gr-label">{escape(t("materials"))}</div>')
    st.pills(
        t("materials"),
        list(MATERIALS),
        selection_mode="multi",
        format_func=material_label,
        key="materials",
        label_visibility="collapsed",
    )

    st.html(f'<div class="gr-muted">{escape(t("points", count=len(shown)))}</div>')
    if source == "snapshot":
        st.warning(t("snapshot"))
        if st.button(t("retry")):
            load_locations.clear()
            st.rerun()

with map_column:
    near_slugs = set(nearest["slug"])
    points = [
        {
            "lat": point["lat"],
            "lng": point["lng"],
            "name": point[f"name_{lang}"],
            "category": point["category"],
            "near": point["slug"] in near_slugs,
        }
        for _, point in shown.iterrows()
    ]
    result = map_view(points, origin, CITY_CENTER, lang, t("you_are_here"), MAP_HEIGHT)

if result.click:
    st.session_state["origin"] = (result.click["lat"], result.click["lng"])
    st.rerun()
