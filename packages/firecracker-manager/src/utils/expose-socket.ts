import { spawnAsync } from "./spawn-async.ts";

// XXX: This repository is PoC.
export const exposeSocket = async (path: string) => {
  return await spawnAsync("sudo", ["chmod", "666", path]);
};
