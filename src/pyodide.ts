import PyodideWorker from "./pyodide.worker?worker";

export type RunResult = {
  gcode: string;
  stdout: string;
};

type WorkerResponse =
  | { type: "init-complete" }
  | { type: "init-error"; error: string }
  | { type: "run-result"; id: number; result: RunResult }
  | { type: "run-error"; id: number; error: string };

let worker: Worker | null = null;
let initPromise: Promise<void> | null = null;
let messageId = 0;

const pendingRequests = new Map<
  number,
  { resolve: (value: RunResult) => void; reject: (error: Error) => void }
>();

function getWorker(): Worker {
  if (!worker) {
    worker = new PyodideWorker();
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;

      switch (message.type) {
        case "run-result": {
          const pending = pendingRequests.get(message.id);
          if (pending) {
            pending.resolve(message.result);
            pendingRequests.delete(message.id);
          }
          break;
        }
        case "run-error": {
          const pending = pendingRequests.get(message.id);
          if (pending) {
            pending.reject(new Error(message.error));
            pendingRequests.delete(message.id);
          }
          break;
        }
      }
    };
  }
  return worker;
}

export async function initPyodide(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = new Promise<void>((resolve, reject) => {
    const w = getWorker();

    const handler = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      if (message.type === "init-complete") {
        w.removeEventListener("message", handler);
        resolve();
      } else if (message.type === "init-error") {
        w.removeEventListener("message", handler);
        reject(new Error(message.error));
      }
    };

    w.addEventListener("message", handler);
    w.postMessage({ type: "init" });
  });

  return initPromise;
}

export async function runPython(code: string): Promise<RunResult> {
  await initPyodide();

  const id = ++messageId;
  const w = getWorker();

  return new Promise<RunResult>((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    w.postMessage({ type: "run", code, id });
  });
}
