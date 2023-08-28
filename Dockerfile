FROM node:lts
LABEL maintainer="Josias Klaus <josias.klaus@web.de>"

WORKDIR /opt/mampfaxo

COPY package.json ./
COPY package-lock.json ./
RUN npm ci

ADD . ./
RUN npm run build

CMD ["npm", "run", "start"]
