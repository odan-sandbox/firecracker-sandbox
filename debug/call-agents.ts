import { createRunnerAgentsClient } from "../packages/os-command-injection/src/create-runner-agents-client.ts";

const VSOCK = "/tmp/firecracker-manager-8FYS4P/v.sock";
// const VSOCK = "./v.sock";

const client = await createRunnerAgentsClient({
  vsock: {
    socketPath: VSOCK,
    port: "8000",
  },
});

const index = await client.index.$get().then((x) => x.text());

console.log("index: ", index);

const run = await client.run
  .$post({ json: { command: "node -v" } })
  .then((x) => x.json());

console.log("run: ", run);
