FROM node:22-alpine
WORKDIR /workspace/services/food-service

COPY services/food-service/package.json services/food-service/package-lock.json ./
RUN npm ci --omit=dev

COPY services/shared /workspace/services/shared
COPY services/food-service/src ./src

RUN chown -R node:node /workspace

ENV NODE_ENV=production
ENV PORT=4002
EXPOSE 4002

USER node
CMD ["node", "src/server.js"]
