FROM node:lts-alpine
LABEL maintainer="Josias Klaus <josias.klaus@web.de>"

WORKDIR /opt/mampfaxo

ENV CHROME_BIN="/usr/bin/chromium-browser" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

RUN apk add --update-cache \
    udev ttf-freefont chromium &&\
    rm -rf /var/cache/apk/*

COPY package.json ./
COPY package-lock.json ./
RUN npm ci

ADD . ./
RUN npm run build

CMD ["npm", "run", "start"]
