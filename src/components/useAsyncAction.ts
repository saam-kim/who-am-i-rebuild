import { useRef, useState } from "react";

export function useAsyncAction() {
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function run(action: () => void | Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    setError(false);
    try {
      await action();
    } catch {
      setError(true);
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  return { run, pending, error };
}
