FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./

RUN npx prisma generate && npm run build

# Must match the PORT the app binds to (set in render.yaml).
EXPOSE 10000

# Migrations are applied separately (`npx prisma migrate deploy`), not on boot:
# running them here delays startup past the host's health-check window, and
# re-running them on every container start doesn't scale past one instance.
CMD ["node", "dist/src/main"]
