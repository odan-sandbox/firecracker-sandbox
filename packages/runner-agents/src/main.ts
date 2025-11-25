import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";

import { rpc } from "./rpc.ts";

const app = new Hono();

app.use(logger());
app.route("/", rpc);

serve(
  {
    fetch: app.fetch,
    port: 8080,
  },
  (info) => {
    console.log(`Listening on http://localhost:${info.port}`);
  }
);
