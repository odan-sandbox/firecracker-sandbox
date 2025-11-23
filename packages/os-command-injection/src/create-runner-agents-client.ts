import net from "node:net";

import { hc } from "hono/client";
import type { RpcType } from "runner-agents/client";
import { Agent } from "undici";

async function handshake(vsockInfo: VsockInfo) {
  let done = false;
  return new Promise<net.Socket>((resolve, reject) => {
    const vsock = net.createConnection(vsockInfo.socketPath, () => {
      console.log("Connected to vsock socket:", vsockInfo.socketPath);
      vsock.write(`CONNECT ${vsockInfo.port}\n`);
    });
    vsock.on("error", (error) => {
      console.error(error);
      if (!done) {
        reject(error);
      }
    });
    vsock.on("close", (hadError) => {
      console.log("vsock close", hadError);
    });
    vsock.on("data", (chunk) => {
      const line = chunk.toString();

      if (line.startsWith("OK ")) {
        done = true;
        resolve(vsock);
      }
    });
  });
}

type VsockInfo = {
  socketPath: string;
  port: string;
};

export async function createRunnerAgentsClient({
  vsock,
}: {
  vsock: VsockInfo;
}) {
  const agent = new Agent({
    connect(_, callback) {
      handshake(vsock)
        .then((socket) => {
          callback(null, socket);
        })
        .catch((error) => {
          callback(error, null);
        });
    },
  });
  const client = hc<RpcType>("http://localhost/", {
    init: {
      // @ts-expect-error
      dispatcher: agent,
    },
  });

  return client;
}
