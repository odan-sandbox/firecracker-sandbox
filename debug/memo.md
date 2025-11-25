https://github.com/firecracker-microvm/firecracker/blob/main/docs/getting-started.md

sudo groupadd fcmanager
sudo usermod -aG fcmanager $USER


```bash
# eval "$(/root/.local/share/fnm/fnm env --use-on-cd --shell bash)"
/bin/sh: 11: eval: [[: not found
/bin/sh: 11: eval: -f: not found
/bin/sh: 11: eval: -f: not found
```

bun build してもうまく動かない
`Bun is a fast JavaScript runtime, package manager, bundler, and test runner.` が出る

```bash
$ rm -rf /tmp/firecracker.socket v.sock

$ ./packages/firecracker-manager/firecracker/firecracker --api-sock /tmp/firecracker.socket --enable-pci --config-file ./debug/vm_config.json
```

```bash
$ mkdir mnt
$ sudo mount environments/rootfs/bash-rootfs.ext4 mnt
```

```log
# 2025/11/25 15:34:53 socat[248] W connect(5, AF=2 127.0.0.1:8080, 16): Network is unreachable
2025/11/25 15:34:53 socat[248] E TCP:127.0.0.1:8080: Network is unreachable
```