# GreenRanger — Find a point

A Streamlit version of the site's "nearest points" finder: search an address or click the map, and it lists the three closest recycling points that match your filters, with today's hours, whether they're open right now, and a directions link.

**What is this?** Upload a photo of an item (or take one with the camera). The same ONNX model the website ships (`../public/models/waste.onnx`) runs here with onnxruntime and names the material. At 71% confidence or more it answers; below that it shows the top three and you pick, so the map is never filtered on a guess. For plastic and metal it asks whether it's a drink bottle or can and adds the bottle machines; for food, plants and mixed trash it says no point takes it. Then the nearest points and the map are filtered to that material. The model code is in `classifier.py`; the photo isn't saved.

Data comes from the public API (`https://api.greenranger.kz/api/locations`), falling back to `../backend/prisma/locations.json` if the API is unreachable. Map tiles are from OpenFreeMap, address search from OpenStreetMap's Nominatim.

## Run locally

```bash
cd insights
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/streamlit run app.py
```

Tests: `.venv/bin/python -m pytest` checks the class-to-material rules. `../ml/check_streamlit.py` checks that `classifier.py` gives the same answers as `ml/evaluate.py` on 10 test photos (all 10 match, probabilities identical).

## Deploy

Streamlit Community Cloud, main file path `insights/app.py`. The theme in `.streamlit/config.toml` is picked up automatically.
