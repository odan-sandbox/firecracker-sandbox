import { join } from "node:path";

type Environment = {
  name: string;
  rootfsPath: string;
  getCommand: (code: string) => string;
};

const PROJECT_ROOT = join(import.meta.dirname, "..", "..", "..");
const ROOTFS_DIR = join(PROJECT_ROOT, "environments", "rootfs");

const getRootfsPath = (name: string) => join(ROOTFS_DIR, `${name}-rootfs.ext4`);

export const getEnvironments = (): Environment[] => {
  return [
    {
      name: "bash",
      rootfsPath: getRootfsPath("bash"),
      getCommand: (code) => code,
    },
    {
      name: "nodejs",
      rootfsPath: getRootfsPath("nodejs"),
      getCommand: (code) => `node -e '${code}'`,
    },
    {
      name: "python",
      rootfsPath: getRootfsPath("python"),
      getCommand: (code) => `python -c '${code}'`,
    },
  ];
};
