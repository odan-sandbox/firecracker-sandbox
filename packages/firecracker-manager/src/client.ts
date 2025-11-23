import { Agent } from "undici";
import { hc } from "hono/client";

import type { RpcType } from "./rpc.ts";
import { SOCKET_PATH } from "./config.ts";

export const createClient = ({
  socketPath = SOCKET_PATH,
}: {
  socketPath?: string;
}) => {
  const client = hc<RpcType>("http://localhost/", {
    init: {
      // @ts-expect-error
      dispatcher: new Agent({
        connect: {
          socketPath,
        },
      }),
    },
  });

  return client;
};

export type { RpcType };
