import net from "node:net";

import { hc } from "hono/client";
import type { RpcType } from "runner-agents/client";
import { Agent } from "undici";
import pRetry, { type RetryContext } from "p-retry";

async function handshake(vsockInfo: VsockInfo): Promise<net.Socket> {
  let done = false;

  return new Promise<net.Socket>((resolve, reject) => {
    const vsock = net.createConnection(vsockInfo.socketPath, () => {
      console.log("Connected to vsock socket:", vsockInfo.socketPath);
      vsock.write(`CONNECT ${vsockInfo.port}\n`);
    });

    const finish = (err: Error | null, socket?: net.Socket) => {
      if (done) return;
      done = true;
      vsock.removeAllListeners();
      if (err) {
        vsock.destroy();
        reject(err);
      } else if (socket) {
        resolve(socket);
      }
    };

    vsock.on("error", (error) => {
      console.error("handshake error", error);
      finish(error);
    });

    vsock.on("close", (hadError) => {
      console.log("vsock close", hadError);
      finish(new Error(`vsock closed before handshake. hadError=${hadError}`));
    });

    vsock.on("end", () => {
      console.log("vsock end");
      finish(new Error("vsock ended before handshake"));
    });

    vsock.on("data", (chunk) => {
      const line = chunk.toString();
      if (line.startsWith("OK ")) {
        console.log("handshake done");
        finish(null, vsock);
      }
    });
  });
}

function shouldRetry({ error }: RetryContext): boolean {
  if (!(error instanceof Error)) return false;

  if (error.message.includes("vsock ended before handshake")) return true;
  if (error.message.includes("vsock closed before handshake")) return true;

  return false;
}

async function handshakeWithRetry(vsockInfo: VsockInfo) {
  return pRetry(() => handshake(vsockInfo), {
    shouldRetry,
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
      handshakeWithRetry(vsock)
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
