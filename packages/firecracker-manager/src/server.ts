import fs from "node:fs";

import { createAdaptorServer } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";

import { rpc } from "./rpc.ts";
import { SOCKET_PATH } from "./config.ts";

const app = new Hono();

app.route("/", rpc);
app.use(logger());

if (fs.existsSync(SOCKET_PATH)) {
  fs.unlinkSync(SOCKET_PATH);
}
const server = createAdaptorServer(app);

server.listen(SOCKET_PATH, () => {
  fs.chmodSync(SOCKET_PATH, 0o666);
  console.log(`firecracker-manager listening on ${SOCKET_PATH}`);
});
