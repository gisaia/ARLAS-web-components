### STAGE 1: Build ###

# We label our stage as 'builder'
FROM node:16.19.0 as builder

ARG mapProvider="maplibre"

COPY ./package.json  ./
COPY ./package-lock.json  ./
COPY ./env.js ./
COPY ./dummy-server.js ./
RUN mkdir local
COPY ./local  ./local

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force

## Storing node modules on a separate layer will prevent unnecessary npm installs at each build
RUN export NODE_OPTIONS=--max_old_space_size=8192 && npm i
WORKDIR /node_modules
RUN cd ./arlas-web-components && npm uninstall mapbox-gl && npm uninstall @types/mapbox-gl
RUN  rm -rf ./@types/mapbox-gl &&  rm -rf ./mapbox-gl &&  rm -rf ./arlas-web-components/node_modules

RUN echo "try to grep mapbox =>" &&  ls . | grep mapbox
RUN echo "try to grep @type =>" &&  ls ./@types | grep mapbox

WORKDIR /

RUN mkdir /ng-app && cp -R ./node_modules ./ng-app
WORKDIR /ng-app

COPY .. .
RUN ls ./node_modules
RUN node ./env.js --map-provider=$mapProvider
RUN echo  "$(cat ./node_modules/arlas-web-components/package.json)"
## Build the angular app in production mode and store the artifacts in dist folder
RUN npm run build:prod

### STAGE 2: Setup ###
RUN npm start-dummy-server
