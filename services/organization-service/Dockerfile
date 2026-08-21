FROM node:22-alpine
WORKDIR /workspace/services/organization-service

COPY services/organization-service/package.json services/organization-service/package-lock.json ./
RUN npm ci --omit=dev

COPY services/shared /workspace/services/shared
COPY services/organization-service/src ./src

RUN chown -R node:node /workspace

ENV NODE_ENV=production
ENV PORT=4003
EXPOSE 4003

USER node
CMD ["node", "src/server.js"]
