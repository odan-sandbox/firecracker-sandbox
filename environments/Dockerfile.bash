FROM node:24-trixie-slim as node

FROM ubuntu:24.04

RUN apt-get update && \
    apt-get install -y ca-certificates socat iproute2 && \
    rm -rf /var/lib/apt/lists/*

COPY --from=node /usr/local/bin/node /usr/local/bin/node

WORKDIR /app

COPY packages/runner-agents/dist/bundle.mjs /app/bundle.mjs
COPY packages/runner-agents/agent /app/agent
COPY environments/entrypoint.sh /app/entrypoint.sh
