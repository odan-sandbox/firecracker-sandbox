import { spawn, type SpawnOptions } from "child_process";

export interface SpawnResult {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: NodeJS.Signals | null;
}

type WaitForStdoutPattern = string | RegExp;

// resolveOn: spawn / exit / close 用
type NormalResolveOptions = SpawnOptions & {
  /**
   * When to resolve the Promise:
   * - "spawn" → child process successfully started
   * - "exit"  → child process exited
   * - "close" → stdio streams fully closed (default)
   */
  resolveOn?: "spawn" | "exit" | "close";

  // このモードでは使わせない
  waitForStdout?: never;
};

// resolveOn: stdout 用
type StdoutResolveOptions = SpawnOptions & {
  /**
   * Resolve when stdout contains this pattern.
   */
  resolveOn: "stdout";
  waitForStdout: WaitForStdoutPattern;
};

// ユーザーが渡す options 型
export type SpawnAsyncOptions = NormalResolveOptions | StdoutResolveOptions;

export function spawnAsync(
  command: string,
  args: string[] = [],
  options: SpawnAsyncOptions = {}
): Promise<SpawnResult> {
  // TS 的には union なので、実装側では any で抜ける
  const {
    resolveOn = "close",
    // NormalResolveOptions では waitForStdout は never なので
    // ユーザー側からは渡せない
    waitForStdout,
    ...spawnOptions
  } = options as SpawnAsyncOptions & { waitForStdout?: WaitForStdoutPattern };

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "pipe",
      ...spawnOptions,
    });

    child.on("message", (data) => {
      console.log("message", data);
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const cleanup = () => {
      child.stdout?.removeAllListeners();
      child.stderr?.removeAllListeners();
      child.removeAllListeners();
    };

    const settleResolve = (result: SpawnResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const settleReject = (err: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const matchStdout = (pattern: WaitForStdoutPattern): boolean => {
      console.log("matchStdout", stdout);
      if (typeof pattern === "string") {
        return stdout.includes(pattern);
      }
      return pattern.test(stdout);
    };

    child.stdout?.on("data", (data) => {
      console.log("stdout", stdout);
      stdout += data.toString();

      if (
        resolveOn === "stdout" &&
        waitForStdout &&
        matchStdout(waitForStdout)
      ) {
        // stdout モードでは、パターンにマッチした瞬間に resolve
        // その時点ではまだ exit code が分からないので null にしておく
        settleResolve({
          stdout,
          stderr,
          code: null,
          signal: null,
        });
      }
    });

    child.stderr?.on("data", (data) => {
      console.log("stderr", data.toString());
      stderr += data.toString();
    });

    child.on("error", (err) => {
      settleReject(err);
    });

    // ---------------------------------
    // resolveOn = "spawn"
    // ---------------------------------
    if (resolveOn === "spawn") {
      child.once("spawn", () => {
        console.log("done spawn");
        settleResolve({
          stdout,
          stderr,
          code: null,
          signal: null,
        });
      });
      return;
    }

    const finish = (code: number | null, signal: NodeJS.Signals | null) => {
      if (resolveOn === "stdout") {
        // stdout モード:
        // すでに stdout マッチで resolve 済みなら何もしない
        if (settled) return;

        // マッチしないまま終わった場合は「通常の完了」として扱う
        const result = { stdout, stderr, code, signal };

        if (code === 0) {
          settleResolve(result);
        } else {
          const error = new Error(
            `Command "${command}" failed with exit code ${code}`
          ) as Error & SpawnResult;
          Object.assign(error, result);
          settleReject(error);
        }
        return;
      }

      // spawn / exit / close モードの通常分岐
      const result = { stdout, stderr, code, signal };

      if (code === 0) {
        settleResolve(result);
      } else {
        const error = new Error(
          `Command "${command}" failed with exit code ${code}`
        ) as Error & SpawnResult;
        Object.assign(error, result);
        settleReject(error);
      }
    };

    // ---------------------------------
    // resolveOn = "exit" or "close" or "stdout"
    // ---------------------------------
    if (resolveOn === "exit" || resolveOn === "stdout") {
      child.once("exit", finish);
    } else {
      child.once("close", finish);
    }
  });
}
