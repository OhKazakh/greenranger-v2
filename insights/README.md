# GreenRanger — Find a point

A Streamlit version of the site's "nearest points" finder: search an address or click the map, and it lists the three closest recycling points that match your filters, with today's hours, whether they're open right now, and a directions link.

Data comes from the public API (`https://api.greenranger.kz/api/locations`), falling back to `../backend/prisma/locations.json` if the API is unreachable. Map tiles are from OpenFreeMap, address search from OpenStreetMap's Nominatim.

## Run locally

```bash
cd insights
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/streamlit run app.py
```

## Deploy

Streamlit Community Cloud, main file path `insights/app.py`. The theme in `.streamlit/config.toml` is picked up automatically.
