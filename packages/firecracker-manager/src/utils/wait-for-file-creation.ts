import fs from "fs";
import path from "path";

export interface WaitForFileCreationOptions {
  /** ms: タイムアウト。なしの場合は無限待ち */
  timeout?: number;
  /** 中断用 AbortSignal */
  signal?: AbortSignal;
}

/**
 * 指定したファイルが作成されるまで待つ
 */
export function waitForFileCreation(
  filePath: string,
  { timeout, signal }: WaitForFileCreationOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(filePath);
    const filename = path.basename(filePath);

    // --- すでに存在している場合は即 resolve ---
    if (fs.existsSync(filePath)) {
      return resolve();
    }

    let timer: NodeJS.Timeout | undefined;

    // --- AbortSignal があれば中断対応 ---
    if (signal) {
      if (signal.aborted) return reject(new Error("Aborted"));
      signal.addEventListener("abort", () => {
        cleanup();
        reject(new Error("Aborted"));
      });
    }

    // --- timeout が指定されていたら設定 ---
    if (timeout != null) {
      timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout: File not created: ${filePath}`));
      }, timeout);
    }

    // --- watcher 作成 ---
    const watcher = fs.watch(dir, (eventType, changedFile) => {
      if (eventType === "rename" && changedFile === filename) {
        // rename は作成/削除/リネームの全部に来るので存在チェック必須
        if (fs.existsSync(filePath)) {
          cleanup();
          resolve();
        }
      }
    });

    function cleanup() {
      watcher.close();
      if (timer) clearTimeout(timer);
    }
  });
}
