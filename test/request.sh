#!/bin/bash

WEBHOOK_NAME=${1:-passed}

echo 'Testing webhook '$WEBHOOK_NAME'...'

curl http://localhost:9000/webhook/$WEBHOOK_NAME?secret=deadbeef
