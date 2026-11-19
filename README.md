# GreenRanger

A map of recycling drop-off points in Astana, Kazakhstan.

Astana has a fair number of places that take plastic, paper, glass, metal and
electronics — they're just hard to find. Most aren't on any list, opening hours
are inconsistent, and half the addresses you find online are wrong. This puts
them on one map.

**Live at [greenranger.kz](https://greenranger.kz)**

## Features

- Map and list views, filterable by material and by type of point
- Sort by distance, and "nearest points": type an address, use your location
  or tap the map to get the three closest points with directions
- "What is this?": take a photo of an item, a model running in the browser
  says which material it is, and the map shows the points that take it, open
  ones first. The photo never leaves the phone
- Details per point: address, hours, phone, what they actually accept
- User reviews and ratings
- Anyone can submit a missing point; an admin reviews it before it goes live
- English, Russian and Kazakh
- Light and dark themes

## Stack

Next.js (App Router) and TypeScript on the frontend, with Tailwind and the
Google Maps JS SDK. The photo model runs with onnxruntime-web; training is
PyTorch. NestJS and Prisma on the backend, Postgres for storage.
Auth is JWT in an httpOnly cookie. Frontend deploys to Vercel, backend to
Render, database on Neon.

## Photo classifier

`ml/` has the training code. The model is MobileNetV3-Large (ImageNet weights)
fine-tuned on 7,279 photos from two public datasets, split 70/15/15 with a
fixed seed. The test set (1,091 photos) is only used once, at the end.

| | |
|---|---|
| Test accuracy | 94.6% (RealWaste 94.9%, TrashNet 93.9%) |
| Right answer in top 3 | 99.3% |
| Model file | 8.5 MB ONNX, fp16 weights |
| Inference | about 20 ms per photo in Chromium on an M3 laptop, one thread |

Full numbers are in `ml/results/metrics.json`, and the confusion matrix is in
`ml/results/confusion_matrix.png`.

The model has 9 classes: cardboard, paper, plastic, glass, metal, textile,
food, vegetation and mixed trash. `src/lib/classify.ts` maps them to the map's
materials. Food, vegetation and mixed trash map to nothing, because no point
on the map takes them. Neither dataset has batteries or electronics, so the
model can't recognise those; users pick them by hand.

If the top class is below 0.71 confidence, the app shows the top 3 and lets
the user choose. It never filters the map on a guess below that. The 0.71 is
the lowest value where at least 98% of answers were right on the validation
set. On the test set, 85% of photos clear it, and 98.3% of those are right.

An int8 version was 4.7 MB but dropped to 67% validation accuracy, so it isn't
used. These numbers are from dataset photos; phone photos of single items in a
kitchen will differ.

To retrain:

```bash
cd ml
python3.12 -m venv .venv && .venv/bin/pip install -r requirements.txt
# put RealWaste in data/realwaste/ and TrashNet in data/trashnet/
.venv/bin/python prepare_data.py
.venv/bin/python train.py
.venv/bin/python export.py
.venv/bin/python evaluate.py
```

### Datasets

- **RealWaste**: S. Single, S. Iranmanesh and R. Raad (2023), UCI Machine
  Learning Repository, [doi:10.24432/C5SS4G](https://doi.org/10.24432/C5SS4G).
  4,752 images, CC BY 4.0.
- **TrashNet**: G. Thung and M. Yang (2016),
  [github.com/garythung/trashnet](https://github.com/garythung/trashnet).
  2,527 images, MIT license.

## Data

Every point is checked by hand against 2GIS and company websites before it's
published. The dataset lives in `backend/prisma/locations.json`.
If you spot something wrong, the "add a point" form takes corrections too.

## Running locally

```bash
# frontend
npm install
npm run dev

# backend
cd backend
npm install
npx prisma migrate dev
npm run start:dev
```

Tests: `npm test` for the web app, `ml/.venv/bin/python -m pytest ml` for the
class list.

Both need env files: copy `.env.example` to `.env.local` for the frontend and
`backend/.env.example` to `backend/.env` for the backend.

## Streamlit version

`insights/` is a small Python app (Streamlit) with the same "find the nearest
point" feature. It reads the live API and falls back to the local dataset.

```bash
cd insights
pip install -r requirements.txt
streamlit run app.py
```

## License

© 2026 Danial Baluanov. All rights reserved.

This is a personal project, published for reference only. You may read the code,
but copying, redistributing or reusing it — in whole or in part — requires
written permission.
