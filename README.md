# GreenRanger

A map of recycling drop-off points in Astana, Kazakhstan.

Astana has a fair number of places that take plastic, paper, glass, metal and
electronics — they're just hard to find. Most aren't on any list, opening hours
are inconsistent, and half the addresses you find online are wrong. This puts
them on one map.

**Live at [greenranger.kz](https://greenranger.kz)**

## Features

- Map and list views, filterable by material and by type of point
- Sort by distance from your location
- Details per point: address, hours, phone, what they actually accept
- User reviews and ratings
- Anyone can submit a missing point; an admin reviews it before it goes live
- Russian, English and Kazakh
- Light and dark themes

## Stack

Next.js (App Router) and TypeScript on the frontend, with Tailwind and the
Google Maps JS SDK. NestJS and Prisma on the backend, Postgres for storage.
Auth is JWT in an httpOnly cookie. Frontend deploys to Vercel, backend to
Render, database on Neon.

## Data

Every point is verified by hand against 2GIS, company websites and phone calls
before it's published. The dataset lives in `backend/prisma/locations.json`.
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

Both need env files — see `backend/.env.example` for the backend and set
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` plus `NEXT_PUBLIC_API_URL` for the frontend.

## License

© 2026 Danial Baluanov. All rights reserved.

This is a personal project, published for reference only. You may read the code,
but copying, redistributing or reusing it — in whole or in part — requires
written permission.
