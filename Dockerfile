# syntax=docker/dockerfile:1

# ---- Build the static site ----
FROM node:24-alpine AS build
WORKDIR /app
ENV ASTRO_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

COPY . .
ARG SITE_URL=https://sotiunion.com
ENV SITE_URL=${SITE_URL}
RUN npm run build

# ---- Serve with unprivileged nginx ----
FROM nginxinc/nginx-unprivileged:1.31-alpine AS runtime

LABEL org.opencontainers.image.title="soti-union" \
      org.opencontainers.image.description="UAB SOTI Union corporate website" \
      org.opencontainers.image.source="https://github.com/izZziCOS/soti-union"

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
