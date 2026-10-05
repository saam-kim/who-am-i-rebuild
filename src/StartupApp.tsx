import { Component, lazy, Suspense, type ReactNode } from "react";
import { missingFirebaseSettings } from "./store/firebaseConfig";

// 설정이 준비된 환경에서만 앱과 Firebase DB를 불러온다.
const App = lazy(() => import("./App"));
const missingSettings = missingFirebaseSettings(import.meta.env);

class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return (
      <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-ink">화면을 불러오지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.</p>
        <button className="text-sm text-brand underline" onClick={() => window.location.reload()}>화면 다시 불러오기</button>
      </div>
    );
    return this.props.children;
  }
}

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
    <AppErrorBoundary>
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-ink-dim">수업 화면 불러오는 중…</div>}>
      <App />
    </Suspense>
    </AppErrorBoundary>
  );
}
