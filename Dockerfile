FROM node:12.14.1-stretch

COPY . /zkdapp

WORKDIR /zkdapp

RUN npm i

ENTRYPOINT [ "/bin/bash", "-c", "npm run start" ]