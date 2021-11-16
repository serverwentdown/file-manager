FROM node:16-bullseye

RUN apt-get update \
    && apt-get install -y \
		build-essential zip unzip \
    && apt-get clean \
	&& rm -rf /var/lib/apt/lists/*

COPY . /usr/local/share/file-manager
RUN cd /usr/local/share/file-manager \
	&& npm install .

VOLUME /data
WORKDIR /data

ENV NODE_ENV=production

CMD ["node", "/usr/local/share/file-manager/index.js"]
