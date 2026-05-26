FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./

RUN npx prisma generate && npm run build

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
