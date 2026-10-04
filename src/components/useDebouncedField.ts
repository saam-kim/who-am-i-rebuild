import { useCallback, useEffect, useRef, useState } from "react";

// 입력이 잠시 멈추면 저장한다. blur를 기다리지 않으며, 화면 이동 시에도
// 대기 중인 입력을 저장한다. 브라우저 종료·네트워크 단절은 별도 보장이 없다.
export function useDebouncedField(initial: string, save: (value: string) => void | Promise<void>, delay = 500) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const saveRef = useRef(save);
  saveRef.current = save;
  const pending = useRef<{ value: string; revision: number } | null>(null);
  const revision = useRef(0);
  const mounted = useRef(true);
  const queue = useRef(Promise.resolve());

  const flush = useCallback(() => {
    const entry = pending.current;
    if (!entry) return;
    pending.current = null;
    const saveCurrent = saveRef.current;
    // 저장이 늦어져도 이전 입력이 새 입력을 덮어쓰지 않도록 순서대로 저장한다.
    queue.current = queue.current.then(() => saveCurrent(entry.value)).then(() => {
      if (mounted.current && revision.current === entry.revision) {
        setSaved(true);
        setError(false);
      }
    }).catch(() => {
      if (mounted.current && revision.current === entry.revision) {
        setSaved(false);
        setError(true);
      }
    });
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.clearTimeout(timer.current);
      // 단계 전환·성찰 이동으로 컴포넌트가 사라져도 마지막 입력은 저장한다.
      flush();
    };
  }, [flush]);

  function onChange(next: string) {
    setValue(next);
    setSaved(false);
    setError(false);
    pending.current = { value: next, revision: ++revision.current };
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, delay);
  }

  return { value, onChange, saved, error };
}
