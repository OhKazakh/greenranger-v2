import pandas as pd
import pydeck as pdk
import streamlit as st

from data import locations_with_notice, points_accepting
from geo import CITY_CENTER, make_grid, nearest_km
from i18n import MATERIALS, current_language, material_label, t

ANY = "any"
GREEN = [34, 170, 110, 70]
YELLOW = [240, 190, 40, 80]
RED = [220, 60, 50, 90]


def cell_color(distance_km, threshold_km):
    if distance_km <= 1:
        return GREEN
    if distance_km <= threshold_km:
        return YELLOW
    return RED


def coverage_table(table, grid, threshold_km):
    rows = []
    for code in MATERIALS:
        accepting = points_accepting(table, [code])
        distances = nearest_km(grid["lat"], grid["lng"], accepting["lat"], accepting["lng"])
        rows.append({
            "material": material_label(code),
            "points": len(accepting),
            "covered": round(float((distances <= threshold_km).mean()) * 100),
        })
    return pd.DataFrame(rows).sort_values("covered")


lang = current_language()
st.title(t("nav_coverage"))
table = locations_with_notice()

choice = st.sidebar.selectbox(
    t("cov_material"),
    [ANY, *MATERIALS],
    format_func=lambda code: t("any_material") if code == ANY else material_label(code),
)
threshold = st.sidebar.slider(t("cov_threshold"), 1.0, 5.0, 2.0, 0.5)
cell_m = st.sidebar.radio(
    t("cov_detail"),
    [250, 500, 1000],
    index=1,
    format_func=lambda m: t("meters", m=m),
    horizontal=True,
)
threshold_text = f"{threshold:g}"

points = table if choice == ANY else points_accepting(table, [choice])
if points.empty:
    st.warning(t("cov_no_points"))
    st.stop()

grid = make_grid(cell_m)
grid["distance_km"] = nearest_km(grid["lat"], grid["lng"], points["lat"], points["lng"])
grid["color"] = [cell_color(d, threshold) for d in grid["distance_km"]]
grid["label"] = [t("cell_label", km=f"{d:.1f}") for d in grid["distance_km"]]

beyond = (grid["distance_km"] > threshold).mean()
worst = grid.loc[grid["distance_km"].idxmax()]

area_metric, worst_metric, points_metric = st.columns(3)
area_metric.metric(t("cov_share_gap", km=threshold_text), f"{beyond:.0%}")
worst_metric.metric(t("cov_worst"), t("km", km=f"{worst['distance_km']:.1f}"))
points_metric.metric(t("cov_points"), len(points))

cells_layer = pdk.Layer(
    "PolygonLayer",
    data=grid[["polygon", "color", "label"]],
    get_polygon="polygon",
    get_fill_color="color",
    stroked=False,
    pickable=True,
)
points_layer = pdk.Layer(
    "ScatterplotLayer",
    data=points.assign(label=points[f"name_{lang}"])[["lng", "lat", "label"]],
    get_position=["lng", "lat"],
    get_radius=90,
    radius_min_pixels=4,
    get_fill_color=[25, 45, 35, 240],
    get_line_color=[255, 255, 255, 255],
    stroked=True,
    line_width_min_pixels=1,
    pickable=True,
)
view = pdk.ViewState(latitude=CITY_CENTER[0], longitude=CITY_CENTER[1], zoom=10.6)
st.pydeck_chart(
    pdk.Deck(
        layers=[cells_layer, points_layer],
        initial_view_state=view,
        views=[pdk.View(type="MapView", controller={"scrollZoom": False})],
        tooltip={"text": "{label}"},
        map_style=None,
    ),
    height=560,
)
st.caption(t("cov_legend", km=threshold_text))
st.caption(t("cov_caveat"))

st.subheader(t("cov_table_title", km=threshold_text))
st.dataframe(
    coverage_table(table, grid, threshold),
    hide_index=True,
    width="stretch",
    column_config={
        "material": st.column_config.TextColumn(t("col_material")),
        "points": st.column_config.NumberColumn(t("col_points")),
        "covered": st.column_config.ProgressColumn(t("col_covered"), format="%d%%", min_value=0, max_value=100),
    },
)
