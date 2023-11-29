
FROM       docker:24.0 AS docker

FROM       oven/bun:1.0.4
COPY       --from=docker /usr/local/bin/docker /usr/local/bin/docker
RUN        mkdir -p /app
WORKDIR    /app
COPY       src .
COPY       cli.js /usr/local/bin/supernova
RUN        bun install --production
EXPOSE     9000
ENTRYPOINT [ "bun", "run", "daemon.js" ]
