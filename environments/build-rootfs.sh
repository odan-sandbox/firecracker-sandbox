set -eux

NAME=$1

docker build -t $NAME-agents . -f ./environments/Dockerfile.$NAME
CID=$(docker create $NAME-agents)

rm -rf rootfs
mkdir -p rootfs
docker export $CID | tar -C rootfs -xf -

docker rm $CID

dd if=/dev/zero of=rootfs.ext4 bs=1M count=400
mkfs.ext4 -F -d rootfs rootfs.ext4

mv rootfs.ext4 ./environments/rootfs/$NAME-rootfs.ext4
