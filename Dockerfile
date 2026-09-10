# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# We just need to transpile TypeScript for the server
RUN npx tsc src/server.ts --outDir dist/server --module esnext --target esnext --moduleResolution node --esModuleInterop --skipLibCheck

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app

# Install Nginx
RUN apk add --no-cache nginx

# Copy frontend assets
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Copy backend assets and dependencies
COPY --from=backend-build /app/dist/server /app/dist/server
COPY --from=backend-build /app/package*.json ./
RUN npm ci --omit=dev

# Nginx Configuration
RUN printf "server { \n\
    listen 80; \n\
    location /api { \n\
        proxy_pass http://localhost:3001; \n\
        proxy_http_version 1.1; \n\
        proxy_set_header Upgrade \$http_upgrade; \n\
        proxy_set_header Connection 'upgrade'; \n\
        proxy_set_header Host \$host; \n\
        proxy_cache_bypass \$http_upgrade; \n\
    } \n\
    location / { \n\
        root /usr/share/nginx/html; \n\
        index index.html index.htm; \n\
        try_files \$uri \$uri/ /index.html; \n\
    } \n\
}" > /etc/nginx/http.d/default.conf

# Start script
RUN printf "#!/bin/sh \n\
nginx \n\
node dist/server/server.js \n\
" > /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost/health || exit 1

CMD ["/app/start.sh"]
