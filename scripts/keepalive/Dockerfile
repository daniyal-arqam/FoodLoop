FROM node:22-alpine
WORKDIR /app

COPY scripts/keepalive.js ./keepalive.js

USER node
CMD ["node", "keepalive.js"]
