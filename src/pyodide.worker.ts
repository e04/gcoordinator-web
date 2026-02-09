import { loadPyodide, version as pyodideVersion } from "pyodide";
import type { PyodideInterface } from "pyodide";

let pyodideInstance: PyodideInterface | null = null;

type WorkerMessage =
  | { type: "init" }
  | { type: "run"; code: string; id: number };

type RunResult = {
  gcode: string;
  stdout: string;
};

type WorkerResponse =
  | { type: "init-complete" }
  | { type: "init-error"; error: string }
  | { type: "run-result"; id: number; result: RunResult }
  | { type: "run-error"; id: number; error: string };

async function initPyodide(): Promise<PyodideInterface> {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  const pyodide = await loadPyodide({
    indexURL: `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`,
  });
  await pyodide.loadPackage("micropip");
  await pyodide.loadPackage("numpy");

  const micropip = pyodide.pyimport("micropip");
  await micropip.install("/gcoordinator-web/gcoordinator-0.0.1-py3-none-any.whl");

  pyodideInstance = pyodide;
  return pyodide;
}

async function runPython(code: string): Promise<RunResult> {
  const pyodide = await initPyodide();

  const outputLines: string[] = [];

  pyodide.setStdout({
    batched: (line: string) => {
      outputLines.push(line);
    },
  });
  pyodide.setStderr({
    batched: (line: string) => {
      outputLines.push(line);
    },
  });

  try {
    pyodide.runPython("if 'full_object' in dir(): del full_object");

    pyodide.runPython(code);

    const hasFullObject = pyodide.runPython("'full_object' in dir()");
    let gcode = "";
    if (hasFullObject) {
      gcode = String(pyodide.runPython("gc.GCode(full_object).generate()"));
    }

    return {
      gcode,
      stdout: outputLines.join("\n"),
    };
  } catch (error) {
    const stdout = outputLines.join("\n");
    throw new Error((stdout ? stdout + "\n" : "") + String(error));
  }
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  switch (message.type) {
    case "init":
      try {
        await initPyodide();
        self.postMessage({ type: "init-complete" } as WorkerResponse);
      } catch (error) {
        self.postMessage({
          type: "init-error",
          error: error instanceof Error ? error.message : String(error),
        } as WorkerResponse);
      }
      break;

    case "run":
      try {
        const result = await runPython(message.code);
        self.postMessage({
          type: "run-result",
          id: message.id,
          result,
        } as WorkerResponse);
      } catch (error) {
        self.postMessage({
          type: "run-error",
          id: message.id,
          error: error instanceof Error ? error.message : String(error),
        } as WorkerResponse);
      }
      break;
  }
};
