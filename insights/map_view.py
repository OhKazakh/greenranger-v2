import streamlit as st

HUB_COLOR = "#1B4332"
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

function mapStyle(lang) {
  const name = ["coalesce", ["get", "name:" + lang], ["get", "name"]];
  const roadWidth = (low, high) => ["interpolate", ["linear"], ["zoom"], 10, low, 16, high];
  return {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: { omt: { type: "vector", url: "https://tiles.openfreemap.org/planet" } },
    layers: [
      { id: "land", type: "background", paint: { "background-color": "#1a1a2e" } },
      { id: "park", type: "fill", source: "omt", "source-layer": "park",
        paint: { "fill-color": "#142218" } },
      { id: "greenery", type: "fill", source: "omt", "source-layer": "landcover",
        filter: ["in", ["get", "class"], ["literal", ["grass", "wood"]]],
        paint: { "fill-color": "#142218" } },
      { id: "water", type: "fill", source: "omt", "source-layer": "water",
        paint: { "fill-color": "#0d1e2a" } },
      { id: "rivers", type: "line", source: "omt", "source-layer": "waterway",
        paint: { "line-color": "#0d1e2a", "line-width": 1.5 } },
      { id: "roads", type: "line", source: "omt", "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["primary", "secondary", "tertiary", "minor", "service"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#252540", "line-width": roadWidth(0.5, 7) } },
      { id: "highways", type: "line", source: "omt", "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#2a2a45", "line-width": roadWidth(1, 10) } },
      { id: "road-names", type: "symbol", source: "omt", "source-layer": "transportation_name",
        minzoom: 13,
        layout: { "symbol-placement": "line", "text-field": name,
                  "text-font": ["Noto Sans Regular"], "text-size": 11 },
        paint: { "text-color": "#8ba090", "text-halo-color": "#1a1a2e", "text-halo-width": 1.2 } },
    ],
  };
}

function swallow(el) {
  for (const type of ["click", "mousedown", "mouseup", "pointerdown", "pointerup", "touchstart", "touchend"]) {
    el.addEventListener(type, (e) => e.stopPropagation());
  }
}

function pinElement(color, big) {
  const w = big ? 44 : 36;
  const h = big ? 55 : 45;
  const el = document.createElement("div");
  el.className = "gr-pin";
  el.style.zIndex = big ? "2" : "1";
  el.innerHTML =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="-2 -2 32 40">` +
    `<path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" ` +
    `fill="${color}" stroke="white" stroke-width="${big ? 3 : 2}"/>` +
    `<circle cx="14" cy="13" r="5" fill="white" fill-opacity="0.95"/></svg>`;
  swallow(el);
  return el;
}

function render(maplibregl, component) {
  const { data, parentElement, setTriggerValue } = component;
  let state = parentElement.__gr;

  if (!state) {
    const container = document.createElement("div");
    container.className = "gr-map";
    container.style.height = data.height + "px";
    parentElement.appendChild(container);

    const map = new maplibregl.Map({
      container,
      style: mapStyle(data.lang),
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
      markers: [],
      origin: null,
      fittedTo: null,
      tip: new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: "gr-tip" }),
    };
    map.on("click", (e) => state.onClick(e));
    parentElement.__gr = state;
  }

  state.onClick = (e) => setTriggerValue("click", { lat: e.lngLat.lat, lng: e.lngLat.lng });

  if (state.lang !== data.lang) {
    state.lang = data.lang;
    state.map.setStyle(mapStyle(data.lang));
  }

  state.markers.forEach((marker) => marker.remove());
  state.markers = [];
  const ordered = [...data.points].sort((a, b) => Number(a.near) - Number(b.near));
  for (const p of ordered) {
    const el = pinElement(p.category === "hub" ? data.hubColor : data.kioskColor, p.near);
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
  width: 100%;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
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
  background: #212135;
  color: #eef5f0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 4px 10px;
  font: 600 12px Inter, sans-serif;
  white-space: nowrap;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
}
.gr-tip .maplibregl-popup-tip { display: none; }
.gr-map .maplibregl-ctrl-group {
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: none;
}
.gr-map .maplibregl-ctrl-group button { width: 36px; height: 36px; }
.gr-map .maplibregl-ctrl-group button + button { border-top: 1px solid rgba(255, 255, 255, 0.08); }
.gr-map .maplibregl-ctrl-icon { filter: invert(1) opacity(0.85); }
.gr-map .maplibregl-ctrl-attrib { background: rgba(26, 26, 46, 0.85); color: #8ba090; }
.gr-map .maplibregl-ctrl-attrib a { color: #8ba090; }
.gr-map .maplibregl-ctrl-attrib-button { filter: invert(1); }
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
            "kioskColor": KIOSK_COLOR,
        },
        height=height,
        on_click_change=lambda: None,
    )
