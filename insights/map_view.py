import streamlit as st

HUB_COLOR = "#1B4332"
HUB_COLOR_DARK = "#40916C"
KIOSK_COLOR = "#2EC4B6"

JS = """
const LIB_JS = "https://cdn.jsdelivr.net/npm/maplibre-gl@5/dist/maplibre-gl.js";
const LIB_CSS = "https://cdn.jsdelivr.net/npm/maplibre-gl@5/dist/maplibre-gl.css";

function loadLibrary() {
  if (!window.__grMapLibre) {
    window.__grMapLibre = new Promise((resolve, reject) => {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = LIB_CSS;
      document.head.appendChild(css);
      const script = document.createElement("script");
      script.src = LIB_JS;
      script.onload = () => resolve(window.maplibregl);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return window.__grMapLibre;
}

const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

const PALETTES = {
  dark: { land: "#1a1a2e", park: "#142218", water: "#0d1e2a", road: "#252540", highway: "#2a2a45", label: "#8ba090" },
  light: { land: "#f5f0e8", park: "#d4e8d0", water: "#b8d8e8", road: "#ffffff", highway: "#fdf8ed", label: "#5a6b5e" },
};

function mapStyle(lang, dark) {
  const c = dark ? PALETTES.dark : PALETTES.light;
  const name = ["coalesce", ["get", "name:" + lang], ["get", "name"]];
  const roadWidth = (low, high) => ["interpolate", ["linear"], ["zoom"], 10, low, 16, high];
  return {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: { omt: { type: "vector", url: "https://tiles.openfreemap.org/planet" } },
    layers: [
      { id: "land", type: "background", paint: { "background-color": c.land } },
      { id: "park", type: "fill", source: "omt", "source-layer": "park",
        paint: { "fill-color": c.park } },
      { id: "greenery", type: "fill", source: "omt", "source-layer": "landcover",
        filter: ["in", ["get", "class"], ["literal", ["grass", "wood"]]],
        paint: { "fill-color": c.park } },
      { id: "water", type: "fill", source: "omt", "source-layer": "water",
        paint: { "fill-color": c.water } },
      { id: "rivers", type: "line", source: "omt", "source-layer": "waterway",
        paint: { "line-color": c.water, "line-width": 1.5 } },
      { id: "roads", type: "line", source: "omt", "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["primary", "secondary", "tertiary", "minor", "service"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": c.road, "line-width": roadWidth(0.5, 7) } },
      { id: "highways", type: "line", source: "omt", "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": c.highway, "line-width": roadWidth(1, 10) } },
      { id: "road-names", type: "symbol", source: "omt", "source-layer": "transportation_name",
        minzoom: 13,
        layout: { "symbol-placement": "line", "text-field": name,
                  "text-font": ["Noto Sans Regular"], "text-size": 11 },
        paint: { "text-color": c.label, "text-halo-color": c.land, "text-halo-width": 1.2 } },
    ],
  };
}

function swallow(el) {
  for (const type of ["click", "mousedown", "mouseup", "pointerdown", "pointerup", "touchstart", "touchend"]) {
    el.addEventListener(type, (e) => e.stopPropagation());
  }
}

function pinElement(color, stroke, hub, big) {
  const w = big ? 44 : 36;
  const h = big ? 55 : 45;
  const glyph = hub
    ? `<rect x="9.5" y="8.5" width="9" height="9" rx="2" fill="white" fill-opacity="0.95"/>`
    : `<circle cx="14" cy="13" r="5" fill="white" fill-opacity="0.95"/>`;
  const el = document.createElement("div");
  el.className = "gr-pin";
  el.style.zIndex = big ? "2" : "1";
  el.innerHTML =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="-2 -2 32 40">` +
    `<path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" ` +
    `fill="${color}" stroke="${stroke}" stroke-width="${big ? 3 : 2}"/>` + glyph + `</svg>`;
  swallow(el);
  return el;
}

function render(maplibregl, component) {
  const { data, parentElement, setTriggerValue } = component;
  const dark = darkQuery.matches;
  let state = parentElement.__gr;

  if (!state) {
    const container = document.createElement("div");
    container.className = "gr-map";
    container.style.height = data.height + "px";
    parentElement.appendChild(container);

    const map = new maplibregl.Map({
      container,
      style: mapStyle(data.lang, dark),
      center: [data.center[1], data.center[0]],
      zoom: 12,
      minZoom: 9,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.getCanvas().style.cursor = "crosshair";

    state = {
      map,
      lang: data.lang,
      dark,
      markers: [],
      origin: null,
      fittedTo: null,
      tip: new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: "gr-tip" }),
    };
    map.on("click", (e) => state.onClick(e));
    darkQuery.addEventListener("change", () => render(maplibregl, state.component));
    parentElement.__gr = state;
  }

  state.component = component;

  state.onClick = (e) => setTriggerValue("click", { lat: e.lngLat.lat, lng: e.lngLat.lng });

  if (state.lang !== data.lang || state.dark !== dark) {
    state.lang = data.lang;
    state.dark = dark;
    state.map.setStyle(mapStyle(data.lang, dark));
  }

  state.markers.forEach((marker) => marker.remove());
  state.markers = [];
  const ordered = [...data.points].sort((a, b) => Number(a.near) - Number(b.near));
  for (const p of ordered) {
    const hub = p.category === "hub";
    const fill = hub ? (dark ? data.hubColorDark : data.hubColor) : data.kioskColor;
    const el = pinElement(fill, dark ? "#ffffff" : data.hubColor, hub, p.near);
    el.addEventListener("mouseenter", () => {
      state.tip.setOffset([0, p.near ? -56 : -46]).setLngLat([p.lng, p.lat]).setText(p.name).addTo(state.map);
    });
    el.addEventListener("mouseleave", () => state.tip.remove());
    state.markers.push(
      new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([p.lng, p.lat]).addTo(state.map)
    );
  }

  if (state.origin) {
    state.origin.remove();
    state.origin = null;
  }
  if (data.origin) {
    const dot = document.createElement("div");
    dot.className = "gr-origin";
    dot.title = data.youAreHere;
    swallow(dot);
    state.origin = new maplibregl.Marker({ element: dot }).setLngLat([data.origin[1], data.origin[0]]).addTo(state.map);
  }

  const near = data.points.filter((p) => p.near);
  const fitKey = data.origin ? JSON.stringify([data.origin, near.map((p) => [p.lat, p.lng])]) : null;
  if (fitKey && fitKey !== state.fittedTo) {
    if (near.length) {
      const bounds = new maplibregl.LngLatBounds([data.origin[1], data.origin[0]], [data.origin[1], data.origin[0]]);
      near.forEach((p) => bounds.extend([p.lng, p.lat]));
      state.map.fitBounds(bounds, { padding: 80, maxZoom: 16 });
    } else {
      state.map.flyTo({ center: [data.origin[1], data.origin[0]], zoom: 14 });
    }
  }
  state.fittedTo = fitKey;
}

export default function (component) {
  loadLibrary().then((maplibregl) => render(maplibregl, component));
}
"""

CSS = """
.gr-map {
  --gr-map-surface: #1a1a2e; --gr-map-text: #eef5f0; --gr-map-muted: #8ba090;
  --gr-map-border: rgba(255, 255, 255, 0.08); --gr-map-icon: invert(1) opacity(0.85);
  width: 100%;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--gr-map-border);
}
@media (prefers-color-scheme: light) {
  .gr-map {
    --gr-map-surface: #ffffff; --gr-map-text: #0d2818; --gr-map-muted: #5a6b5e;
    --gr-map-border: #d4ccb4; --gr-map-icon: none;
  }
}
.gr-pin { cursor: pointer; }
.gr-origin {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #22c55e;
  border: 2.5px solid #fff;
  box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.25);
}
.gr-tip .maplibregl-popup-content {
  background: var(--gr-map-surface, #212135);
  color: var(--gr-map-text, #eef5f0);
  border: 1px solid var(--gr-map-border, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  padding: 4px 10px;
  font: 600 12px Inter, sans-serif;
  white-space: nowrap;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}
.gr-tip .maplibregl-popup-tip { display: none; }
.gr-map .maplibregl-ctrl-group {
  background: var(--gr-map-surface);
  border: 1px solid var(--gr-map-border);
  box-shadow: none;
}
.gr-map .maplibregl-ctrl-group button { width: 36px; height: 36px; }
.gr-map .maplibregl-ctrl-group button + button { border-top: 1px solid var(--gr-map-border); }
.gr-map .maplibregl-ctrl-icon { filter: var(--gr-map-icon); }
.gr-map .maplibregl-ctrl-attrib { background: var(--gr-map-surface); color: var(--gr-map-muted); opacity: 0.9; }
.gr-map .maplibregl-ctrl-attrib a { color: var(--gr-map-muted); }
.gr-map .maplibregl-ctrl-attrib-button { filter: var(--gr-map-icon); }
"""

_component = st.components.v2.component("greenranger_map", js=JS, css=CSS, isolate_styles=False)


def map_view(points, origin, center, lang, you_are_here, height):
    return _component(
        key="map",
        data={
            "points": points,
            "origin": list(origin) if origin else None,
            "center": list(center),
            "lang": lang,
            "youAreHere": you_are_here,
            "height": height,
            "hubColor": HUB_COLOR,
            "hubColorDark": HUB_COLOR_DARK,
            "kioskColor": KIOSK_COLOR,
        },
        height=height,
        on_click_change=lambda: None,
    )
