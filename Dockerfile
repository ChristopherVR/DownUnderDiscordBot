FROM node:latest as base

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

WORKDIR /app

COPY package*.json ./

RUN rm -rf node_modules && npm ci

# RUN npm install --global rimraf && npm install --global parcel-bundler

COPY . .

EXPOSE 8080

FROM base as production

ENV NODE_PATH=./dist

RUN npm run build

CMD ["node", "./dist/bot.js"]