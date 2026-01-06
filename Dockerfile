FROM node:20-alpine AS development-dependencies-env
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

FROM node:20-alpine AS production-dependencies-env
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS build-env
WORKDIR /app
COPY package.json package-lock.json ./
COPY --from=development-dependencies-env /app/node_modules ./node_modules
COPY . .

# ✅ OBLIGATOIRE POUR PRISMA
RUN npx prisma generate

RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY --from=production-dependencies-env /app/node_modules ./node_modules
COPY --from=build-env /app/build ./build

CMD ["npm", "run", "start"]
