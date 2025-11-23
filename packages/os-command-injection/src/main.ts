import { setTimeout } from "node:timers/promises";

import { createClient as createFirecrackerClient } from "firecracker-client";

import { createFirecrackerManagerClient } from "./create-firecracker-manager-client.ts";
import { createRunnerAgentsClient } from "./create-runner-agents-client.ts";

const firecrackerManagerClient = createFirecrackerManagerClient();

const vmStartResponse = await firecrackerManagerClient.vm.start.$post({
  json: {
    rootfsPath:
      "/home/odan/source/github.com/odan-sandbox/firecracker-sandbox/rootfs.ext4",
  },
});

const vmStart = await vmStartResponse.json();

console.log("vmStart", vmStart);

await setTimeout(1000);

const firecrackerClient = createFirecrackerClient({
  socketPath: vmStart.firecrackerSocketPath,
});

const instanceInfo = await firecrackerClient.describeInstance();

console.log("instanceInfo", instanceInfo);

await setTimeout(1000);

const runnerAgentsClient = await createRunnerAgentsClient({
  vsock: {
    socketPath: vmStart.vSocketPath,
    port: "8000",
  },
});

const res = await runnerAgentsClient.index.$get();
console.log("agents", await res.text());
const res3 = await runnerAgentsClient.index.$get();
console.log("agents", await res3.text());

const code = `
console.log("Hello World!")
`;
const res2 = await runnerAgentsClient.run.$post({
  json: {
    code,
  },
});

console.log("run done", await res2.json());
