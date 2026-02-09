// Store for managing large output/error text without React state
type Listener = () => void;

interface OutputStore {
  gcode: string;
  stdout: string;
  error: string | null;
  selectedLine: number | null;
}

let store: OutputStore = {
  gcode: "",
  stdout: "",
  error: null,
  selectedLine: null,
};

const listeners = new Set<Listener>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function setGcode(value: string) {
  store = { ...store, gcode: value };
  emitChange();
}

export function setStdout(value: string) {
  store = { ...store, stdout: value };
  emitChange();
}

export function setError(value: string | null) {
  store = { ...store, error: value };
  emitChange();
}

export function clearOutput() {
  store = { gcode: "", stdout: "", error: null, selectedLine: null };
  emitChange();
}

export function setSelectedLine(line: number | null) {
  store = { ...store, selectedLine: line };
  emitChange();
}

export function getSnapshot(): OutputStore {
  return store;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Selectors for useSyncExternalStore
export function getGcodeSnapshot(): string {
  return store.gcode;
}

export function getStdoutSnapshot(): string {
  return store.stdout;
}

export function getErrorSnapshot(): string | null {
  return store.error;
}

export function getSelectedLineSnapshot(): number | null {
  return store.selectedLine;
}
