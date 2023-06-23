#!/bin/bash

WEBHOOK_NAME=${1:-passed}

echo 'Testing webhook '$WEBHOOK_NAME'...'
echo

URL='http://localhost:48214/webhook/'$WEBHOOK_NAME'?secret=deadbeef'

# if $2 equals github, send POST request with JSON body
if [ "$2" == 'check_branch' ]; then
    curl -X POST \
         -H 'Content-Type: application/json' \
         -H 'X-GitHub-Event: push' \
         -d "{\"ref\":\"refs/heads/$3\"}" \
         -D - $URL'&check_branch=true'
else
    curl -X POST -D - $URL
fi

echo
