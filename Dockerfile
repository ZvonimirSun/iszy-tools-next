FROM node:24-alpine
WORKDIR /app

LABEL authors="ZvonimirSun"
LABEL description="A Docker image for ISZY Tools Nuxt"

# `.output` is built by CI before the image is assembled.
COPY .output/ ./

ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV NODE_OPTIONS="--use-system-ca --use-env-proxy"

EXPOSE 3000

CMD ["node", "/app/server/index.mjs"]
