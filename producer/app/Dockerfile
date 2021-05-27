FROM alpine
RUN apk update && apk upgrade
RUN apk add nodejs

RUN echo node --version

WORKDIR /app
ADD . /app
ENTRYPOINT [ "node", "app.js"]