import { lazy, Suspense } from "react";
import { missingFirebaseSettings } from "./store/firebaseConfig";

// 설정이 준비된 환경에서만 앱과 Firebase DB를 불러온다.
const App = lazy(() => import("./App"));
const missingSettings = missingFirebaseSettings(import.meta.env);

export default function StartupApp() {
  if (missingSettings.length) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="glass-card w-full max-w-md rounded-[14px] p-6 text-center">
          <h1 className="text-xl font-bold text-ink">수업 연결 설정이 필요합니다</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-dim">
            이 환경의 서비스 연결 설정이 완료되지 않았습니다. 운영자에게 문의하거나 운영 주소로 접속해 주세요.
          </p>
          <a className="mt-5 inline-block text-sm font-bold text-brand underline" href="https://who-am-i-rebuild.vercel.app">
            운영 주소로 이동
          </a>
        </div>
      </div>
    );
  }
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-ink-dim">수업 화면 불러오는 중…</div>}>
      <App />
    </Suspense>
  );
}
