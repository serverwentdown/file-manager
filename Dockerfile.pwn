FROM registry.makerforce.io/ambrose/pwn

USER root

RUN apk add --no-cache \
    build-base \
    python2

COPY . /usr/local/fm

RUN cd /usr/local/fm \
    && /home/ambrose/.local/bin/yarn install \
    && /home/ambrose/.local/bin/yarn cache clean

USER ambrose

ENV SHELL="zsh -l"

CMD ["node", "/usr/local/fm/index.js"]
