FROM alpine:3.13
RUN apk update && apk upgrade
RUN apk add --update nodejs npm

RUN addgroup -S node && adduser -S node -G node
USER node

RUN mkdir /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node package-lock.json package.json ./

RUN npm ci

COPY --chown=node:node . .

CMD [ "node", "app.js"]