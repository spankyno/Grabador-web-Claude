# =============================================
# worker/Dockerfile
# Railway usa worker/ como root directory, así que
# todos los paths son relativos a esa carpeta.
# =============================================

FROM node:20-slim AS base

RUN apt-get update && apt-get install -y \
    ffmpeg \
    ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN ffmpeg -version | head -2

# ===== Build stage =====
FROM base AS builder

WORKDIR /app

# package files primero para aprovechar caché de Docker
COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

# Código fuente — tipos ya incluidos en src/types.ts
COPY src ./src

# Compilar TypeScript
RUN npm run build

# ===== Production stage =====
FROM base AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
