#!/bin/sh

exec > /var/log/entrypoint.log 2>&1

set -eux

echo "debug echo"

# --- loopback を有効化 ---
ip link set lo up
# ip addr add 127.0.0.1/8 dev lo

command -v fnm >/dev/null 2>&1 && eval "$(fnm env --use-on-cd --shell bash)"
# --- bundle.mjs 起動 ---
node /app/bundle.mjs &
# /app/agent
AGENT_PID=$!

# --- vsock → TCP ブリッジ起動 ---
socat VSOCK-LISTEN:8000,fork TCP:127.0.0.1:8080 &
SOCAT_PID=$!

# --- どちらかが死んだら VM も終了させる ---
wait $AGENT_PID
wait $SOCAT_PID