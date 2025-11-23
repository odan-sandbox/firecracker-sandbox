import { serve } from "@hono/node-server";
import { Hono } from "hono";

import { rpc } from "./rpc.ts";

const app = new Hono();

app.route("/", rpc);

serve({
  fetch: app.fetch,
  port: 8080,
});
