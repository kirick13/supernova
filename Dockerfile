
FROM       golang:1.19.4 AS golang
RUN        go install github.com/adnanh/webhook@2.8.0

FROM       docker:24.0 AS docker

FROM       oven/bun:0.6.7
COPY       --from=golang /go/bin/webhook /usr/local/bin/webhook
COPY       --from=docker /usr/local/bin/docker /usr/local/bin/docker
RUN        mkdir -p /app
WORKDIR    /app
COPY       ./src .
COPY       ./docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN        bun install --production
EXPOSE     9000
ENTRYPOINT [ "docker-entrypoint.sh" ]
