FROM node:lts as build
WORKDIR /app

# Add and install dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm ci

# Add and build app
ADD . /app
RUN npm run build

FROM node:lts
LABEL maintainer="Josias Klaus <josias.klaus@web.de>"

COPY --from=build /app/dist /opt/mampfaxo
WORKDIR /opt/mampfaxo

CMD ["node", "index.js"]
