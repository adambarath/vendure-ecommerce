FROM node:20-alpine as prod
EXPOSE 8003

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install --production

COPY . .

RUN npm run build
