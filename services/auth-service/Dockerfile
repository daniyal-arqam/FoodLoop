FROM node:22-alpine
WORKDIR /workspace/services/auth-service

COPY services/auth-service/package.json services/auth-service/package-lock.json ./
RUN npm ci --omit=dev

COPY services/shared /workspace/services/shared
COPY services/auth-service/src ./src

RUN chown -R node:node /workspace

ENV NODE_ENV=production
ENV PORT=4001
EXPOSE 4001

USER node
CMD ["node", "src/server.js"]
