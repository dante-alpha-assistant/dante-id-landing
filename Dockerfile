# Stage 1: Build frontend
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Vite inlines env vars at build time
ARG VITE_SUPABASE_URL=https://lessxkxujvcmublgwdaa.supabase.co
ARG VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlc3N4a3h1anZjbXVibGd3ZGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjE0NjUsImV4cCI6MjA4NjkzNzQ2NX0.HoGHrO4MHc06V1WXYQQTRERHvQaShWOPb3gW4DV7G1A
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app

# Install ALL deps (root + server share node_modules)
COPY package*.json ./
RUN npm ci --omit=dev

# Server has its own deps
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy server code + built frontend + public assets
COPY server/ ./server/
COPY public/ ./public/
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "server/index.js"]
