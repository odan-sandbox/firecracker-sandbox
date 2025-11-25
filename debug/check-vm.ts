import { createClient } from "../packages/firecracker-client/src/index.ts";

const SOCKET_PATH = "/tmp/firecracker-manager-NTvBep/firecracker.socket";

const client = createClient({ socketPath: SOCKET_PATH });

const instance = await client.describeInstance();

console.log("instance: ", instance);
