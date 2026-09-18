import streamlit as st

from data import locations_with_notice
from i18n import t

st.title("GreenRanger Insights")
st.write(t("app_intro"))
locations_with_notice()

left, right = st.columns(2)

with left.container(border=True):
    st.subheader(t("nav_finder"))
    st.write(t("finder_blurb"))
    st.page_link("views/finder.py", label=t("open_page"))

with right.container(border=True):
    st.subheader(t("nav_coverage"))
    st.write(t("coverage_blurb"))
    st.page_link("views/coverage.py", label=t("open_page"))
