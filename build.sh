#!/bin/sh

IMAGE='kirickme/supernova'
TAG='0.2.0'

docker buildx create --name multibuilder
docker buildx use multibuilder

docker buildx build --push \
                    --platform linux/amd64,linux/arm64/v8 \
                    --tag $IMAGE:$TAG \
                    .

sleep 5

docker image ls | grep $IMAGE
