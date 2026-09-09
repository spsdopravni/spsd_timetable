# ── build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Nejdřív jen manifesty — vrstva s npm ci se pak přebuildí jen když se
# opravdu změní závislosti, ne při každé úpravě zdrojáku.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Klient chodí na vlastní origin; klíče k API doplňuje nginx za běhu,
# takže se do bundlu nedostanou. Viz docker/nginx.conf.template.
ENV VITE_API_PROXY=/api
ARG VITE_USE_MOCK_DATA=false
ENV VITE_USE_MOCK_DATA=$VITE_USE_MOCK_DATA

RUN npm run build

# ── runtime ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Šablona se přes envsubst rozbalí při startu kontejneru, takže klíče
# přicházejí z prostředí a nejsou zapečené v image.
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

ENV NGINX_PORT=80 \
    METEO_UPSTREAM=http://10.0.10.208 \
    GOLEMIO_UPSTREAM=https://api.golemio.cz \
    WEATHER_UPSTREAM=https://api.weatherapi.com \
    ALERTS_UPSTREAM=https://timetable.brozovec.eu

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1

EXPOSE 80
