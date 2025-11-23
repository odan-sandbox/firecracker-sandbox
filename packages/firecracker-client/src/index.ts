import { Agent, fetch } from "undici";
import type { operations, paths } from "./swagger.ts";
import { URL } from "node:url";

async function callApi(
  path: string,
  method: string,
  body: unknown,
  options: { agent: Agent }
) {
  const url = new URL(path, "http://localhost");

  const res = await fetch(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    dispatcher: options.agent,
  });

  if (!res.ok) {
    const error = await res.text();
    const faultMessage = JSON.parse(error)["fault_message"];
    throw new Error(`callApi Error: ${faultMessage}`);
  }

  const text = await res.text();

  if (text) {
    return JSON.parse(text);
  }
}

const putGuestBootSource = async ({ agent }: { agent: Agent }) => {};

class FirecrackerClient {
  #agent: Agent;
  constructor({ agent }: { agent: Agent }) {
    this.#agent = agent;
  }

  async describeInstance() {
    const data = await callApi("/", "GET", undefined, { agent: this.#agent });
    return data as operations["describeInstance"]["responses"]["200"]["schema"];
  }

  async putGuestBootSource(
    params: operations["putGuestBootSource"]["parameters"]
  ) {
    const data = await callApi("/boot-source", "PUT", params.body.body, {
      agent: this.#agent,
    });

    return data as operations["putGuestBootSource"]["responses"]["204"];
  }

  async putGuestDriveByID(
    params: operations["putGuestDriveByID"]["parameters"]
  ) {
    const path = "/drives/{drive_id}".replace(
      "{drive_id}",
      params.path.drive_id
    );
    const data = await callApi(path, "PUT", params.body.body, {
      agent: this.#agent,
    });

    return data as operations["putGuestDriveByID"]["responses"]["204"];
  }

  async putGuestVsock(params: operations["putGuestVsock"]["parameters"]) {
    const data = await callApi("/vsock", "PUT", params.body.body, {
      agent: this.#agent,
    });

    return data as operations["putGuestVsock"]["responses"]["204"];
  }

  async createSyncAction(params: operations["createSyncAction"]["parameters"]) {
    const data = await callApi("/actions", "PUT", params.body.info, {
      agent: this.#agent,
    });

    return data as operations["createSyncAction"]["responses"]["204"];
  }
}

export const createClient = ({ socketPath }: { socketPath: string }) => {
  const agent = new Agent({
    connect: {
      socketPath,
    },
  });

  return new FirecrackerClient({ agent });
};
