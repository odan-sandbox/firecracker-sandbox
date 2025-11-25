import { setTimeout } from "node:timers/promises";

import * as z from "zod";
import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { logger } from "hono/logger";
import { Hono } from "hono";
import { createClient as createFirecrackerClient } from "firecracker-client";

import { createFirecrackerManagerClient } from "./create-firecracker-manager-client.ts";
import { createRunnerAgentsClient } from "./create-runner-agents-client.ts";
import { getEnvironments } from "./environments.ts";

const firecrackerManagerClient = createFirecrackerManagerClient();
const environments = getEnvironments();

const app = new Hono();

app.use(logger());

app
  .get("/", (c) => {
    return c.text("Hello Node.js!");
  })
  .post(
    "/run",
    zValidator(
      "form",
      z.object({
        file: z.file(),
        payload: z
          .string()
          .transform((str) => JSON.parse(str))
          .pipe(
            z.object({
              environmentName: z.string(),
            })
          ),
      })
    ),
    async (c) => {
      const form = c.req.valid("form");

      console.log("form", form);
      const code = await form.file.text();

      console.log("code", code);
      const { environmentName } = form.payload;

      const environment = environments.find((x) => x.name === environmentName);

      if (!environment) {
        throw new Error(`Not found environment name: ${environmentName}`);
      }

      const vmStartResponse = await firecrackerManagerClient.vm.start.$post({
        json: {
          rootfsPath: environment.rootfsPath,
        },
      });

      const vmStart = await vmStartResponse.json();
      console.log("vmStart", vmStart);

      const firecrackerClient = createFirecrackerClient({
        socketPath: vmStart.firecrackerSocketPath,
      });

      const instanceInfo = await firecrackerClient.describeInstance();
      console.log("instanceInfo", instanceInfo);

      const runnerAgentsClient = await createRunnerAgentsClient({
        vsock: {
          socketPath: vmStart.vSocketPath,
          port: "8000",
        },
      });

      const command = environment.getCommand(code);

      const res = await runnerAgentsClient.run.$post({
        json: {
          command,
        },
      });
      const { stdout, stderr } = await res.json();

      return c.json({ stdout, stderr });
    }
  );

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});
