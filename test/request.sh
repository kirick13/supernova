#!/bin/bash

WEBHOOK_NAME=${1:-passed}

echo 'Testing webhook '$WEBHOOK_NAME'...'
echo

curl -D - "http://localhost:48214/webhook/$WEBHOOK_NAME?secret=deadbeef"
echo
