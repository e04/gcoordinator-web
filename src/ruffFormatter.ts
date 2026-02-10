import initRuffWasm, { PositionEncoding, Workspace } from "@astral-sh/ruff-wasm-web";
import ruffWasmUrl from "@astral-sh/ruff-wasm-web/ruff_wasm_bg.wasm?url";

const DEFAULT_RUFF_SETTINGS = {
  "line-length": 88,
  "indent-width": 4,
  format: {
    "indent-style": "space",
    "quote-style": "double",
  },
};

let initPromise: Promise<void> | null = null;
let workspaceInstance: Workspace | null = null;

const ensureWorkspace = async (): Promise<Workspace> => {
  if (!initPromise) {
    initPromise = initRuffWasm({ module_or_path: ruffWasmUrl })
      .then(() => undefined)
      .catch((err) => {
        initPromise = null;
        throw err;
      });
  }

  await initPromise;

  if (!workspaceInstance) {
    workspaceInstance = new Workspace(DEFAULT_RUFF_SETTINGS, PositionEncoding.Utf16);
  }

  return workspaceInstance;
};

export const formatPythonWithRuff = async (source: string): Promise<string> => {
  if (!source.trim()) {
    return source;
  }

  const workspace = await ensureWorkspace();
  return workspace.format(source);
};
