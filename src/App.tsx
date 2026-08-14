import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { JoinScreen } from "./routes/student/JoinScreen";
import { StudentPlay } from "./routes/student/StudentPlay";
import { TeacherHome } from "./routes/teacher/TeacherHome";
import { TeacherDashboard } from "./routes/teacher/TeacherDashboard";

function HomeScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6 text-center">
      <div>
        <span className="font-mono-label inline-block rounded-full bg-brand-dim px-4 py-1.5 text-[11px] text-brand-ink">
          정의로운 사회 만들기 · 수업 시뮬레이션
        </span>
        <h1 className="mt-5 flex items-end justify-center gap-3">
          <span className="text-4xl font-black tracking-tight text-brand-ink">무지의</span>
          <span className="mb-1 h-9 w-[3px] rounded-full bg-brand" />
          <span className="mb-0.5 text-3xl font-extrabold tracking-tight text-brand">베일</span>
        </h1>
        <p className="mt-3 text-[13.5px] leading-relaxed text-ink-dim">
          당신은 자신이 어떤 계층으로 태어날지 모릅니다.<br />그 사회의 규칙을, 지금 함께 정합니다.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          to="/join"
          className="font-mono-label rounded-[10px] border border-brand-ink/40 bg-linear-to-br from-brand to-brand-ink px-5 py-3 text-center text-sm font-bold uppercase text-white shadow-[0_4px_10px_rgba(37,99,235,0.25)] transition-all duration-250 ease-[cubic-bezier(0.175,0.885,0.32,1.15)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(37,99,235,0.4)]"
        >
          학생으로 참여하기
        </Link>
        <Link
          to="/teacher"
          className="font-mono-label rounded-full border border-line bg-surface-1 px-5 py-3 text-center text-sm font-bold uppercase text-ink-dim shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5"
        >
          교사 대시보드
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/join" element={<JoinScreen />} />
        <Route path="/play/:code" element={<StudentPlay />} />
        <Route path="/teacher" element={<TeacherHome />} />
        <Route path="/teacher/:code" element={<TeacherDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
