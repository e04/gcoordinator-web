import { useState, useCallback } from "react";

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  parser: (value: string) => T = (v) => v as unknown as T,
  serializer: (value: T) => string = (v) => String(v),
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    return saved ? parser(saved) : defaultValue;
  });

  const setStateWithStorage = useCallback(
    (value: T) => {
      setState(value);
      localStorage.setItem(key, serializer(value));
    },
    [key, serializer],
  );

  return [state, setStateWithStorage];
}

export function useLocalStorageNumber(
  key: string,
  defaultValue: number,
): [number, (value: number) => void] {
  return useLocalStorageState(
    key,
    defaultValue,
    (v) => parseFloat(v),
    (v) => v.toString(),
  );
}
