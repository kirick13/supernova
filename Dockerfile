
FROM		golang:1.19.4-alpine AS golang
RUN			go install github.com/adnanh/webhook@2.8.0

FROM		docker:20.10.22-alpine3.17 AS docker

FROM		python:3.11.1-alpine AS python
COPY		--from=golang /go/bin/webhook /bin/webhook
COPY		--from=docker /usr/local/bin/docker /bin/docker
RUN			apk add --no-cache git \
			&& python3 -m pip install pyyaml requests \
			&& rm -rf /var/cache/apk/* \
			&& mkdir -p /supernova
EXPOSE		9000
WORKDIR		/supernova
COPY		./src .
ENTRYPOINT	[ "/bin/sh", "-c", "python3 init.py && webhook -debug -verbose -urlprefix webhook -secure -cert /etc/supernova/ssl/cert.pem -key /etc/supernova/ssl/key.pem" ]
