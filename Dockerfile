FROM node:22-alpine

WORKDIR /app

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm ci

# Copy backend source
COPY backend/ ./

# Generate Prisma client and build TypeScript
RUN npx prisma generate && npm run build

EXPOSE 3001

CMD ["node", "dist/src/main"]
