import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../store/firebase";

export function ConnectionNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const disconnected = () => {
      if (timer === undefined) timer = setTimeout(() => setShow(true), 6000);
    };
    disconnected();
    const unsubscribe = onValue(ref(db, ".info/connected"), (snapshot) => {
      if (snapshot.val() === true) {
        clearTimeout(timer);
        timer = undefined;
        setShow(false);
      } else disconnected();
    }, disconnected);
    return () => { clearTimeout(timer); unsubscribe(); };
  }, []);
  if (!show) return null;
  return <div role="status" className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl rounded-xl border border-warn bg-warn-bg p-3 text-center text-[13px] text-warn">수업 서버에 연결하는 중입니다. 인터넷 연결을 확인하고, 저장이 끝날 때까지 이 창을 닫지 마세요.</div>;
}
