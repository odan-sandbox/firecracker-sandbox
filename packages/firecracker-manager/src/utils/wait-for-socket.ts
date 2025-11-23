import net from "node:net";
import fs from "node:fs";

export function waitForSocket(
  socketPath: string,
  interval = 200
): Promise<void> {
  return new Promise((resolve) => {
    const tryConnect = () => {
      console.log("tryConnect...", socketPath);
      // ファイルが存在していない時点で接続は不可能
      if (!fs.existsSync(socketPath)) {
        return setTimeout(tryConnect, interval);
      }

      const socket = net.createConnection({ path: socketPath });

      socket.on("connect", () => {
        socket.end();
        resolve();
      });

      socket.on("error", () => {
        socket.destroy();
        setTimeout(tryConnect, interval);
      });
      return;
    };

    tryConnect();
  });
}
