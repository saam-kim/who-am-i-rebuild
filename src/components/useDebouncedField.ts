import { useCallback, useEffect, useRef, useState } from "react";

// onBlur만으로 저장하면, 학생이 입력을 마지막 행동으로 남기고 다른 곳을
// 탭하지 않은 채 끝나버릴 때(수업 종료, 탭 종료 등) 저장이 아예 안 되는
// 위험이 있다. 타이핑 중 주기적으로 저장해 그 위험을 없앤다.
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
