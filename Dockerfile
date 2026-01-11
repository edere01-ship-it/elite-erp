# 1️⃣ Install all deps (dev + prod)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma

# 2️⃣ Build the app
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app ./
COPY . .
RUN npm run build

# 3️⃣ Production image
FROM node:20-alpine
WORKDIR /app

# Prisma needs openssl
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# COPY prisma schema
COPY prisma ./prisma

# 🔥 CRUCIAL: generate Prisma CLIENT HERE
RUN npx prisma generate

# Copy build output
COPY --from=build /app/build ./build

CMD ["npm", "run", "start"]
