import streamlit as st

from i18n import pick_language, t

st.set_page_config(page_title="GreenRanger Insights", layout="wide")

pick_language()

pages = [
    st.Page("views/home.py", title=t("nav_home"), url_path="home", default=True),
    st.Page("views/finder.py", title=t("nav_finder"), url_path="finder"),
    st.Page("views/coverage.py", title=t("nav_coverage"), url_path="coverage"),
]
st.navigation(pages).run()
