#!/bin/sh

DOCKER_IMAGE='kirickme/supernova'
DOCKER_TAG='0.7.6-dev'

docker manifest inspect $DOCKER_IMAGE:$DOCKER_TAG >/dev/null 2>&1
if [ $? -ne 0 ]; then
    docker buildx create --name multibuilder >/dev/null 2>&1
    docker buildx use multibuilder
    docker buildx build --push \
                        --platform linux/amd64,linux/arm64 \
                        --tag $DOCKER_IMAGE:$DOCKER_TAG \
                        .
else
    echo 'Image '$DOCKER_IMAGE:$DOCKER_TAG' already exists, building aborted.'
    echo
fi

docker pull $DOCKER_IMAGE:$DOCKER_TAG
echo
docker image ls | grep $DOCKER_IMAGE
