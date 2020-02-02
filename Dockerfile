FROM node:10.16.3-jessie

COPY . /zkdapp

WORKDIR /zkdapp

RUN npm i

ENTRYPOINT [ "/bin/bash", "-c", "npm run start" ]