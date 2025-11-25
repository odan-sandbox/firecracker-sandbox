set -eux

curl -X POST http://localhost:3000/run \
  -H "Content-Type: multipart/form-data" \
  -F "file=@$2" \
  -F "payload={\"environmentName\": \"$1\"};type=application/json"