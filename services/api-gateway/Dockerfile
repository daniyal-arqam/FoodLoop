FROM node:22-alpine
WORKDIR /workspace/services/api-gateway

COPY services/api-gateway/package.json services/api-gateway/package-lock.json ./
RUN npm ci --omit=dev

COPY services/shared /workspace/services/shared
COPY services/api-gateway/src ./src

RUN chown -R node:node /workspace

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

USER node
CMD ["node", "src/server.js"]
