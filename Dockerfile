# Stage 1: Build frontend
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app

# Install server deps from root package.json (server uses require from root node_modules)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy server + built frontend + public assets
COPY server/ ./server/
COPY public/ ./public/
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "server/index.js"]
