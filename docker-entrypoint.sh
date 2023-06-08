#!/bin/sh

DEBUG_ARGS=""
if [ ! -z "$SUPERNOVA_DEBUG" ]
then
	DEBUG_ARGS="-debug -verbose"
fi

bun run init.js \
&& webhook $DEBUG_ARGS -urlprefix webhook
