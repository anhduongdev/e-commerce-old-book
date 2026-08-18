FROM node:20-slim AS builder
WORKDIR /app

# bcrypt is a native module; build tools guarantee it compiles even if no
# prebuilt binary matches this image's node/glibc version.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads

EXPOSE 3002
CMD ["node", "dist/main"]
