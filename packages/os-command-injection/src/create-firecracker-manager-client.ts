import { Agent } from "undici";
import { hc } from "hono/client";

import type { RpcType } from "firecracker-manager/client";
import { SOCKET_PATH } from "firecracker-manager/config";

export const createFirecrackerManagerClient = (options?: {
  socketPath?: string;
}) => {
  const socketPath = options?.socketPath ?? SOCKET_PATH;

  const agent = new Agent({
    connect: {
      socketPath,
    },
  });

  const client = hc<RpcType>("http://localhost/", {
    init: {
      // @ts-expect-error
      dispatcher: agent,
    },
  });

  return client;
};
