import { useRef, useState } from "react";

// onBlur만으로 저장하면, 학생이 입력을 마지막 행동으로 남기고 다른 곳을
// 탭하지 않은 채 끝나버릴 때(수업 종료, 탭 종료 등) 저장이 아예 안 되는
// 위험이 있다. 타이핑 중 주기적으로 저장해 그 위험을 없앤다.
export function useDebouncedField(initial: string, save: (value: string) => void, delay = 500) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(true);
  const timer = useRef<number | undefined>(undefined);

  function onChange(next: string) {
    setValue(next);
    setSaved(false);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      save(next);
      setSaved(true);
    }, delay);
  }

  return { value, onChange, saved };
}
