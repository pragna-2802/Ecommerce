FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY movies.json ./movies.json
COPY backend.js ./backend.js

EXPOSE 10000
USER node
CMD ["node", "backend.js"]
