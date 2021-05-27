FROM alpine
RUN apk update && apk upgrade
RUN apk add nodejs
RUN apk add npm

WORKDIR /app

RUN npm install

ADD . /app
ENTRYPOINT [ "node", "app.js"]