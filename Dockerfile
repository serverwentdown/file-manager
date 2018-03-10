FROM node:9-stretch

RUN apt-get update \
    && apt-get install -y build-essential zip unzip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY . /src

RUN cd /src \
    && yarn install \
    && yarn cache clean

VOLUME /data
WORKDIR /data

CMD ["node", "/src/index.js"]
