#!/bin/bash

normalpath () {
	python3 -c 'import os,sys;print(os.path.abspath(os.path.expanduser(sys.argv[1])))' $1
}

SCRIPT_DIR=$(normalpath $(dirname $0))
DOCKER_IMAGE='local/supernova'

cd $SCRIPT_DIR/..
docker build -t $DOCKER_IMAGE .

cd $SCRIPT_DIR
docker run --rm \
           --interactive \
           --tty \
           --name supernova-test \
           -p 48214:9000 \
           -e SUPERNOVA_DEBUG=1 \
           --env-file $HOME/+vault/Public/supernova/env \
           -v $SCRIPT_DIR/config.yml:/etc/supernova/config.yml:ro \
           -v $SCRIPT_DIR/.repos:/var/supernova/repos \
           -v /var/run/docker.sock:/var/run/docker.sock \
           $DOCKER_IMAGE

cd $PWD
