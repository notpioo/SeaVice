# Multi-stage build for optimized production image
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Dependencies stage - install all dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# Builder stage - build the application
FROM base AS builder
WORKDIR /app

# Declare build-time arguments for Firebase config
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_PROJECT_ID

# Convert to ENV so Vite can use them during build
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application (Vite frontend + esbuild backend)
RUN npm run build

# Runner stage - minimal production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressuser

# Copy only production dependencies
COPY --from=deps --chown=expressuser:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=expressuser:nodejs /app/dist ./dist
COPY --from=builder --chown=expressuser:nodejs /app/package.json ./package.json

USER expressuser

# Railway injects PORT environment variable dynamically
EXPOSE 5000

# Start the production server
CMD ["npm", "run", "start"]
