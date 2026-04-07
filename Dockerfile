# --- Stage 1: Build the Vite frontend ---
FROM node:20-alpine AS client-build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY index.html index.js index.css vite.config.js ./
RUN npm run build

# --- Stage 2: Production server ---
FROM node:20-alpine
WORKDIR /app

# Install server dependencies
COPY server/package.json ./server/
RUN cd server && npm ci --omit=dev

# Copy server code
COPY server/ ./server/

# Copy built client
COPY --from=client-build /app/dist ./dist

# Copy production entry that serves both API + static files
COPY server/index.js ./server/

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "server/index.js"]
