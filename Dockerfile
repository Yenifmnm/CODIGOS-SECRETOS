# syntax=docker/dockerfile:1

FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite incorpora estas variables públicas dentro del bundle durante el build.
# Si falta alguna, la imagen de producción no se crea: evita entregar por error
# una versión conectada al adapter mock.
ARG VITE_API_URL
ARG VITE_RECAPTCHA_SITE_KEY
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_RECAPTCHA_SITE_KEY=${VITE_RECAPTCHA_SITE_KEY}

RUN test -n "$VITE_API_URL" \
    && test -n "$VITE_RECAPTCHA_SITE_KEY" \
    && npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY deploy/security-headers.conf /etc/nginx/snippets/codigos-secretos-security.conf
COPY deploy/nginx-container.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
