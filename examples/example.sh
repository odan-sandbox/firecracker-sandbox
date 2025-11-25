#!/bin/bash

echo "Hello World! form bash"

fib () {
  local n=$1
  if [ "$n" -lt 2 ]; then
    echo "$n"
  else
    local a=$(fib $((n - 1)))
    local b=$(fib $((n - 2)))
    echo $((a + b))
  fi
}

echo "$(fib 10)"