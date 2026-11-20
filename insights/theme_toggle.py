"""A sun/moon button that switches between the light and dark theme, like the one on the website.

Streamlit has no Python call to change the theme. Its own settings menu (hidden in this app) saves the
choice in the browser's localStorage and applies it when the page loads, so this button does the same
and reloads the page.
"""

import streamlit as st

# Lucide's "sun" and "moon" icons, the same ones the website uses.
SUN = (
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/>'
    '<path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/>'
    '<path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>'
)
MOON = (
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>'
)

JS = """
export default function (component) {
  const { data, parentElement } = component;
  let button = parentElement.querySelector("button.gr-theme");
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "gr-theme";
    parentElement.appendChild(button);
    button.addEventListener("click", () => {
      // The same key and values Streamlit's settings menu uses for "Choose app theme".
      localStorage.setItem(`stActiveTheme-${window.location.pathname}-v2`, JSON.stringify(button.dataset.next));
      window.location.reload();
    });
  }
  button.dataset.next = data.dark ? "Light" : "Dark";
  button.classList.toggle("gr-theme-dark", data.dark);
  button.title = data.label;
  button.setAttribute("aria-label", data.label);
  button.innerHTML = data.dark ? data.sun : data.moon;
}
"""

CSS = """
.gr-theme {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; padding: 0; cursor: pointer;
  border-radius: 10px; border: 1px solid #d4ccb4; background: transparent; color: #0d2818;
  transition: background .15s, border-color .15s;
}
.gr-theme:hover { background: #f3efe4; }
.gr-theme.gr-theme-dark { border-color: rgba(255, 255, 255, 0.12); color: #eef5f0; }
.gr-theme.gr-theme-dark:hover { background: rgba(39, 39, 64, 0.6); }
.gr-theme:focus-visible { outline: 2px solid #2ec4b6; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .gr-theme { transition: none; } }
"""

_component = st.components.v2.component("greenranger_theme", js=JS, css=CSS, isolate_styles=False)


def theme_toggle(dark, label):
    """Draw the button: a sun in the dark theme (switches to light), a moon in the light theme (switches to dark)."""
    return _component(key="theme", data={"dark": bool(dark), "label": label, "sun": SUN, "moon": MOON})
