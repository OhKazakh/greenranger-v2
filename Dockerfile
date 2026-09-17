FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./

RUN npx prisma generate && npm run build

# Must match the PORT the app binds to (set in render.yaml).
EXPOSE 10000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
