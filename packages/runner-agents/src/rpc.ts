import { exec as _exec } from "node:child_process";
import { promisify } from "node:util";

import { Hono } from "hono";
import * as z from "zod/mini";
import { zValidator } from "@hono/zod-validator";

const exec = promisify(_exec);

const app = new Hono();
const routes = app
  .get("/", (c) => c.text("Hello Node.js!"))
  .post(
    "/run",
    zValidator(
      "json",
      z.object({
        command: z.string(),
      })
    ),
    async (c) => {
      const { command } = c.req.valid("json");

      const { stdout, stderr } = await exec(command);

      return c.json({
        stdout,
        stderr,
      });
    }
  );

export type RpcType = typeof routes;
export const rpc = app;
