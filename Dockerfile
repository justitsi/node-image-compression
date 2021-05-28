FROM node:14-alpine
RUN apk add bash
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY ./src ./src
EXPOSE 8001
WORKDIR /usr/src/app/src
CMD [ "node", "index.js" ]