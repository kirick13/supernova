#!/bin/bash

normalpath () {
	python3 -c 'import os,sys;print(os.path.abspath(os.path.expanduser(sys.argv[1])))' $1
}

SCRIPT_DIR=$(normalpath $(dirname $0))
DOCKER_IMAGE='local/supernova:latest'

cd $SCRIPT_DIR/..
docker build -t $DOCKER_IMAGE .

cd $SCRIPT_DIR
docker run --rm \
           --name supernova-test \
           -p 9000:9000 \
           --env-file $HOME/+vault/@me/supernova-tests/env \
           -v $SCRIPT_DIR/config.yml:/etc/supernova/config.yml:ro \
           -v /var/run/docker.sock:/var/run/docker.sock \
           $DOCKER_IMAGE

cd $PWD
