import { useCallback, useEffect, useRef, useState } from "react";

// 입력이 잠시 멈추면 저장한다. blur를 기다리지 않으며, 화면 이동 시에도
// 대기 중인 입력을 저장한다. 브라우저 종료·네트워크 단절은 별도 보장이 없다.
export function useDebouncedField<T>(initial: T, save: (value: T) => void | Promise<void>, delay = 500, syncInitial = false) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const saveRef = useRef(save);
  saveRef.current = save;
  const pending = useRef<{ value: T; revision: number } | null>(null);
  const revision = useRef(0);
  const mounted = useRef(true);
  const queue = useRef(Promise.resolve());

  useEffect(() => {
    // 화면 진입 직전 저장된 값이 늦게 도착하면 미편집 입력만 동기화한다.
    if (syncInitial && revision.current === 0) setValue(initial);
  }, [initial, syncInitial]);

  const flush = useCallback(() => {
    const entry = pending.current;
    if (!entry) return;
    pending.current = null;
    const saveCurrent = saveRef.current;
    // 저장이 늦어져도 이전 입력이 새 입력을 덮어쓰지 않도록 순서대로 저장한다.
    queue.current = queue.current.then(() => {
      // 연결 지연 중 쌓인 중간 입력은 건너뛰고 최신 입력만 전송한다.
      if (entry.revision < revision.current) return;
      return saveCurrent(entry.value);
    }).then(() => {
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

  function onChange(next: T, immediate = false) {
    setValue(next);
    setSaved(false);
    setError(false);
    pending.current = { value: next, revision: ++revision.current };
    window.clearTimeout(timer.current);
    if (immediate) flush();
    else timer.current = window.setTimeout(flush, delay);
  }

  return { value, onChange, saved, error };
}
