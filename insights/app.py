import hashlib
import io
from base64 import b64encode
from html import escape

import requests
import streamlit as st
from PIL import UnidentifiedImageError

from classifier import asks_drink, classify, decide, materials_for, open_photo, threshold
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


def svg_image(svg, size):
    """Embed an SVG as a base64 <img>, because st.html strips inline SVG."""
    encoded = b64encode(svg.encode()).decode()
    return f'<img src="data:image/svg+xml;base64,{encoded}" width="{size}" height="{size}" alt="">'


LEAF_IMG = svg_image(LEAF, 16)

STYLES = """
<style>
:root {
  --gr-text: #eef5f0; --gr-muted: #8ba090; --gr-border: rgba(255,255,255,0.08); --gr-sep: rgba(255,255,255,0.12);
  --gr-hover: rgba(39,39,64,0.4); --gr-accent: #2ec4b6; --gr-accent-edge: rgba(46,196,182,0.4);
  --gr-open-bg: rgba(46,196,182,0.1); --gr-closed: #f87171; --gr-closed-bg: rgba(248,113,113,0.1);
  --gr-unknown-bg: #272740;
}
@media (prefers-color-scheme: light) {
  :root {
    --gr-text: #0d2818; --gr-muted: #5a6b5e; --gr-border: #d4ccb4; --gr-sep: #d4ccb4;
    --gr-hover: #f3efe4; --gr-accent: #0f766e; --gr-accent-edge: rgba(15,118,110,0.45);
    --gr-open-bg: rgba(15,118,110,0.1); --gr-closed: #b91c1c; --gr-closed-bg: rgba(185,28,28,0.1);
    --gr-unknown-bg: #eeeade;
  }
}
[data-testid="stHeader"] { display: none; }
[data-testid="stMainBlockContainer"] { padding-top: 1.1rem; padding-bottom: 1.5rem; max-width: 1440px; }
[data-testid="InputInstructions"] { display: none; }
.gr-brand { display: flex; align-items: center; gap: 10px; }
.gr-brand a { display: flex; align-items: center; gap: 9px; text-decoration: none; color: var(--gr-text); }
.gr-logo { width: 30px; height: 30px; border-radius: 8px; background: #1b4332;
           display: flex; align-items: center; justify-content: center; }
.gr-name { font-family: "Space Grotesk", sans-serif; font-weight: 700; font-size: 17px; }
.gr-sep { width: 1px; height: 18px; background: var(--gr-sep); }
.gr-page { color: var(--gr-accent); font-size: 14px; font-weight: 500; }
.gr-label { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
            color: var(--gr-muted); margin: 2px 0 6px; }
.gr-muted { font-size: 13px; color: var(--gr-muted); line-height: 1.5; }
.gr-tiny { font-size: 11px; color: var(--gr-muted); margin-top: -6px; }
.gr-cards { display: flex; flex-direction: column; gap: 8px; }
.gr-card { border: 1px solid var(--gr-border); border-radius: 10px; padding: 11px 12px;
           display: flex; justify-content: space-between; gap: 10px; transition: border-color .15s, background .15s; }
.gr-card:hover { border-color: var(--gr-accent-edge); background: var(--gr-hover); }
.gr-card-name { font-size: 14px; font-weight: 600; color: var(--gr-text); text-decoration: none; line-height: 1.35; }
.gr-card-name:hover { color: var(--gr-accent); }
.gr-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 7px; margin-top: 7px; }
.gr-badge { font-size: 11.5px; font-weight: 500; padding: 2px 7px; border-radius: 5px; }
.gr-open { background: var(--gr-open-bg); color: var(--gr-accent); }
.gr-closed { background: var(--gr-closed-bg); color: var(--gr-closed); }
.gr-unknown { background: var(--gr-unknown-bg); color: var(--gr-muted); }
.gr-hours { font-size: 11.5px; color: var(--gr-muted); }
.gr-side { display: flex; flex-direction: column; align-items: flex-end; gap: 7px; flex-shrink: 0; }
.gr-dist { font-size: 13.5px; font-weight: 600; color: var(--gr-text); }
.gr-dir { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--gr-muted); text-decoration: none; }
.gr-dir:hover { color: var(--gr-accent); }
@media (prefers-reduced-motion: reduce) { .gr-card { transition: none; } }
.gr-result { font-size: 15px; font-weight: 600; color: var(--gr-text); line-height: 1.35; }
.gr-sure { font-size: 13px; color: var(--gr-muted); margin-top: 2px; }
.gr-note { font-size: 13px; color: var(--gr-text); line-height: 1.5; }
.gr-card { cursor: pointer; }
.gr-card:focus-visible { outline: 2px solid var(--gr-accent); outline-offset: 2px; }
</style>
"""


def brand_html():
    """The header: logo, name and the page title in the current language."""
    return (
        '<div class="gr-brand">'
        f'<a href="https://greenranger.kz" target="_blank"><span class="gr-logo">{LEAF_IMG}</span>'
        '<span class="gr-name">GreenRanger</span></a>'
        f'<span class="gr-sep"></span><span class="gr-page">{escape(t("page"))}</span>'
        "</div>"
    )


def card_html(rank, point, origin, now, lang):
    """HTML for one nearest-point card: name, open status, today's hours, distance and directions."""
    status = open_status(point, now)
    hours = todays_hours(point, now)
    name = escape(point[f"name_{lang}"])
    details = f"https://greenranger.kz/locations/{point['slug']}"
    route = directions_url(origin, point["lat"], point["lng"])
    hours_html = f'<span class="gr-hours">{escape(hours)}</span>' if hours else ""
    return (
        f'<div class="gr-card" data-slug="{escape(point["slug"])}" tabindex="0"><div>'
        f'<a class="gr-card-name" href="{details}" target="_blank">{rank}. {name}</a>'
        f'<div class="gr-meta"><span class="gr-badge gr-{status}">{t("status_" + status)}</span>{hours_html}</div>'
        '</div><div class="gr-side">'
        f'<span class="gr-dist">{format_distance(point["distance_km"])}</span>'
        f'<a class="gr-dir" href="{route}" target="_blank">↗ {t("directions")}</a>'
        "</div></div>"
    )


def apply_materials(materials):
    """Button callback: filter the nearest list and the map to these materials."""
    # Callbacks run before the next rerun, so the material pills further down already show the new filter.
    st.session_state["materials"] = list(materials)
    st.session_state["photo_applied"] = list(materials)


def apply_drink_answer(cls, key):
    """Pills callback for "Is it a drink bottle or can?": filter right away with or without the bottle machines."""
    answer = st.session_state.get(key)
    if answer is not None:
        apply_materials(materials_for(cls, drink=answer == "yes"))


@st.cache_data(show_spinner=False, max_entries=20)
def classify_bytes(data):
    """Classify a photo given as bytes. Cached, so a rerun doesn't run the model again on the same photo."""
    return classify(open_photo(io.BytesIO(data)))


def photo_section(origin):
    """The "What is this?" section: a photo goes in, a material comes out, then the map is filtered.

    Above the model's threshold it answers; below it, it shows the top three and the user picks.
    The filter is only ever set by a button or answer the user clicks, never by a guess.
    """
    st.html(f'<div class="gr-label">{escape(t("wit_title"))}</div>')
    source = st.segmented_control(
        t("wit_title"),
        ["upload", "camera"],
        format_func=lambda option: t(f"wit_{option}"),
        default="upload",
        required=True,
        key="photo_source",
        label_visibility="collapsed",
    )
    if source == "camera":
        photo = st.camera_input(t("wit_camera"), key="camera_photo", label_visibility="collapsed")
    else:
        photo = st.file_uploader(
            t("wit_upload"), type=["jpg", "jpeg", "png", "webp"], key="upload_photo", label_visibility="collapsed"
        )
    if photo is None:
        st.html(f'<div class="gr-muted">{escape(t("wit_hint"))} {escape(t("wit_saved"))}</div>')
        return

    data = photo.getvalue()
    photo_id = hashlib.sha1(data).hexdigest()[:12]
    if st.session_state.get("photo_id") != photo_id:
        # A new photo starts the questions over.
        st.session_state["photo_id"] = photo_id
        st.session_state["photo_applied"] = None
    try:
        ranked = classify_bytes(data)
    except (UnidentifiedImageError, OSError):
        st.warning(t("wit_read_failed"))
        return

    kind, options = decide(ranked, threshold())
    # The photo and the answer sit side by side; the choices and questions go full width below them.
    thumb, body = st.columns([1, 2.4], vertical_alignment="center")
    thumb.image(data, width="stretch")
    if kind == "confident":
        cls, prob = options[0]
        body.html(
            f'<div class="gr-result">{escape(t("wit_looks", label=t("class_" + cls)))}</div>'
            f'<div class="gr-sure">{escape(t("wit_sure", percent=round(prob * 100)))}</div>'
        )
    else:
        body.html(f'<div class="gr-result">{escape(t("wit_unsure"))}</div>')
        percent = dict(options)
        cls = st.pills(
            t("wit_unsure"),
            [c for c, _ in options] + ["other"],
            selection_mode="single",
            format_func=lambda c: t("wit_other") if c == "other" else f"{t('class_' + c)} {round(percent[c] * 100)}%",
            key=f"pick_{photo_id}",
            label_visibility="collapsed",
        )
        if cls == "other":
            # None of the three: the user picks any material, including ones the model can't see (batteries).
            material = st.pills(
                t("wit_pick_material"),
                list(MATERIALS),
                selection_mode="single",
                format_func=material_label,
                key=f"material_{photo_id}",
            )
            if material:
                show_button([material], origin)
            return
        if cls is None:
            return

    if not materials_for(cls):
        st.html(f'<div class="gr-note">{escape(t("wit_none"))}</div>')
        return
    if asks_drink(cls):
        key = f"drink_{photo_id}_{cls}"
        st.pills(
            t("wit_drink"),
            ["yes", "no"],
            selection_mode="single",
            format_func=lambda answer: t(f"wit_{answer}_{cls}"),   # e.g. "Yes, a drink bottle" / "No, other plastic"
            key=key,
            on_change=apply_drink_answer,
            args=(cls, key),
        )
        st.html(f'<div class="gr-tiny">{escape(t("wit_drink_hint"))}</div>')
        if st.session_state.get("photo_applied"):
            show_button(st.session_state["photo_applied"], origin)
        return
    show_button(materials_for(cls), origin)


def show_button(materials, origin):
    """Offer "Show points" for these materials, or say what the map shows once it's applied."""
    if st.session_state.get("photo_applied") == list(materials):
        names = ", ".join(MATERIALS[m][current_language()] for m in materials)
        hint = "" if origin else " " + t("wit_set_origin")
        st.html(f'<div class="gr-muted">{escape(t("wit_showing", materials=names) + hint)}</div>')
    else:
        st.button(t("wit_show"), on_click=apply_materials, args=(materials,), type="primary", icon=":material/map:")


st.set_page_config(page_title="GreenRanger — Astana", layout="wide")
st.html(STYLES)

st.session_state.setdefault("origin", None)

brand, switch = st.columns([3, 1], vertical_alignment="center")
with switch:
    st.segmented_control(
        "lang",
        list(LANGUAGES),
        format_func=LANGUAGES.get,
        default="en",
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
    photo_section(st.session_state["origin"])
    st.divider()

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
                # Rerun so the sections drawn above this form (the photo section) see the new start point too.
                st.rerun()
            else:
                st.toast(t("not_found"))

    origin = st.session_state["origin"]
    nearest = shown.iloc[0:0]
    if origin and not shown.empty:
        # Distance to every shown point at once (numpy arrays), then keep the closest three.
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
            "slug": point["slug"],
        }
        for _, point in shown.iterrows()
    ]
    result = map_view(points, origin, CITY_CENTER, lang, t("you_are_here"), MAP_HEIGHT)

# A click on the map becomes the new start point.
if result.click:
    st.session_state["origin"] = (result.click["lat"], result.click["lng"])
    st.rerun()
