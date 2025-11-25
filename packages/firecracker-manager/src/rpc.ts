import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import * as z from "zod";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createClient } from "firecracker-client";

import { spawnAsync } from "./utils/spawn-async.ts";
import { exposeSocket } from "./utils/expose-socket.ts";
import { waitForFileCreation } from "./utils/wait-for-file-creation.ts";

const app = new Hono();

const FIRECRACKER_ASSETS_DIR = join(import.meta.dirname, "..", "firecracker");
const DEFAULT_KERNAL_IMAGE_PATH = join(
  FIRECRACKER_ASSETS_DIR,
  "vmlinux-6.1.141"
);
const FIRECRACKER_BINARY_PATH = join(FIRECRACKER_ASSETS_DIR, "firecracker");

const routes = app
  .get("/", (c) => {
    return c.text("Hello Hono!");
  })
  .post("/", (c) => {
    return c.json({ message: "Hello Hono! from POST" });
  })
  .post("/version", (c) => {
    return c.json({ message: "v1.2.3" });
  })
  .post(
    "/vm/start",
    zValidator(
      "json",
      z.object({
        kernelImagePath: z
          .string()
          .optional()
          .default(DEFAULT_KERNAL_IMAGE_PATH),
        rootfsPath: z.string(),
        vsockPort: z.number().optional().default(52),
      })
    ),
    async (c) => {
      const json = c.req.valid("json");
      const id = globalThis.crypto.randomUUID();
      const dir = fs.mkdtempSync(join(tmpdir(), "firecracker-manager-"));

      console.log("dir", dir);
      const firecrackerSocketPath = join(dir, "firecracker.socket");
      const vSocketPath = join(dir, "v.sock");
      const logFilePath = join(dir, "firecracker.log");

      fs.writeFileSync(logFilePath, "");

      const firecrackerResult = await spawnAsync(
        "sudo",
        [
          FIRECRACKER_BINARY_PATH,
          "--id",
          id,
          "--api-sock",
          firecrackerSocketPath,
          "--enable-pci",
          "--log-path",
          logFilePath,
        ],
        { resolveOn: "spawn" }
      );
      console.log("firecrackerResult", firecrackerResult);

      await waitForFileCreation(firecrackerSocketPath);
      await exposeSocket(firecrackerSocketPath);

      const client = createClient({ socketPath: firecrackerSocketPath });

      await client.putGuestBootSource({
        body: {
          body: {
            kernel_image_path: json.kernelImagePath,
            boot_args: "console=ttyS0 reboot=k panic=1 init=/app/entrypoint.sh",
          },
        },
      });

      // TODO: copy roofs
      await client.putGuestDriveByID({
        path: {
          drive_id: "rootfs",
        },
        body: {
          body: {
            drive_id: "rootfs",
            is_root_device: true,
            path_on_host: json.rootfsPath,
          },
        },
      });

      await client.putGuestVsock({
        body: {
          body: {
            guest_cid: 3,
            uds_path: vSocketPath,
          },
        },
      });

      await waitForFileCreation(vSocketPath);
      await exposeSocket(vSocketPath);

      await client.createSyncAction({
        body: {
          info: {
            action_type: "InstanceStart",
          },
        },
      });

      return c.json({ id, firecrackerSocketPath, vSocketPath });
    }
  );

export type RpcType = typeof routes;
export const rpc = app;
