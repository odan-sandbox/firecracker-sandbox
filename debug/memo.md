# memo

## 一旦 getting-started.md やるのがわかりやすい

https://github.com/firecracker-microvm/firecracker/blob/main/docs/getting-started.md


## VM の中身何もなさすぎて fnm が使えなかった

```bash
# eval "$(/root/.local/share/fnm/fnm env --use-on-cd --shell bash)"
/bin/sh: 11: eval: [[: not found
/bin/sh: 11: eval: -f: not found
/bin/sh: 11: eval: -f: not found
```

## bun build してもうまく動かない

`Bun is a fast JavaScript runtime, package manager, bundler, and test runner.` が出る

bun コマンドとして動作してしまっている

`BUN_BE_BUN` を有効化したときのような挙動

## デバッグ用に VM を立ち上げる手順

```bash
$ rm -rf /tmp/firecracker.socket v.sock

$ ./packages/firecracker-manager/firecracker/firecracker --api-sock /tmp/firecracker.socket --enable-pci --config-file ./debug/vm_config.json
```

## .ext4 の中身を覗く

```bash
$ mkdir mnt
$ sudo mount environments/rootfs/bash-rootfs.ext4 mnt
```

## ip で loopback を有効化しないとエラーになる

```log
# 2025/11/25 15:34:53 socat[248] W connect(5, AF=2 127.0.0.1:8080, 16): Network is unreachable
2025/11/25 15:34:53 socat[248] E TCP:127.0.0.1:8080: Network is unreachable
```