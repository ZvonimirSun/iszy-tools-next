FROM node:24-alpine
WORKDIR /app

LABEL authors="ZvonimirSun"
LABEL description="A Docker image for ISZY Tools Nuxt"

RUN apk add --no-cache nginx \
    && ln -sf /dev/stderr /var/log/nginx/error.log

# Configure nginx: serve static files from /app/public and proxy others to Nuxt
RUN mkdir -p /app/static && cat <<'EOF' > /etc/nginx/http.d/default.conf
server {
    listen 80;
    server_name _;

    include mime.types;
    types {
        application/manifest+json webmanifest;
    }

    location / {
        root /app/static;
        try_files $uri @nuxt;
    }

    location @nuxt {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_buffering off;
        proxy_hide_header X-Powered-By;
    }

    access_log off;
    error_log /var/log/nginx/error.log warn;
}
EOF

# `.output` is built by CI before the image is assembled.
COPY .output/ ./

# Nuxt listens on localhost:3000, nginx is exposed on :80
ENV PORT=3000
ENV HOST=127.0.0.1
ENV NODE_OPTIONS="--use-system-ca --use-env-proxy"

EXPOSE 80

CMD ["sh", "-c", "node /app/server/index.mjs & exec nginx -g 'daemon off;'"]
