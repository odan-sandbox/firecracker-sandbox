import { Hono } from "hono";

const app = new Hono();

const routes = app
  .get("/", (c) => {
    return c.text("Hello Hono!");
  })
  .post("/", (c) => {
    return c.json({ message: "Hello Hono! from POST" });
  })
  .post("/version", (c) => {
    return c.json({ message: "v1.2.3" });
  });

export type RpcType = typeof routes;
export const rpc = app;
