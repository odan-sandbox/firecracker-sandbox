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
      console.error("handshake error", error);
      if (!done) {
        done = true;
        reject(error);
      }
    });
    vsock.on("close", (hadError) => {
      console.log("vsock close", hadError);
      if (!done) {
        done = true;
        reject(
          new Error(`vsock closed before handshake. hadError=${hadError}`)
        );
      }
    });
    vsock.on("connect", () => {
      console.log("vsock connected");
    });
    vsock.on("end", () => {
      console.log("vsock end");
      if (!done) {
        done = true;
        reject(new Error("vsock ended before handshake"));
      }
    });
    vsock.on("data", (chunk) => {
      const line = chunk.toString();

      if (line.startsWith("OK ")) {
        console.log("handshake done");
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
