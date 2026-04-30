FROM node:20-slim AS builder

WORKDIR /app

# Build-time env vars. Vite inlines anything starting with VITE_ during the
# client bundle build, so these MUST be present when `npm run build` runs.
# Railway passes service variables as build args automatically when declared
# here as ARG.
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/start.sh ./start.sh
RUN chmod +x start.sh

ENV NODE_ENV=production
EXPOSE 5000

CMD ["./start.sh"]
