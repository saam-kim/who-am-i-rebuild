import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { JoinScreen } from "./routes/student/JoinScreen";
import { StudentPlay } from "./routes/student/StudentPlay";
import { TeacherHome } from "./routes/teacher/TeacherHome";
import { TeacherDashboard } from "./routes/teacher/TeacherDashboard";

function HomeScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface-0 p-6 text-center">
      <div>
        <p className="font-mono-label text-[11px] uppercase text-brand">Who Am I</p>
        <h1 className="mt-1 text-2xl font-extrabold text-ink">무지의 베일</h1>
        <p className="mt-2 text-[13px] text-ink-dim">정의로운 사회 만들기 수업 시뮬레이션</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          to="/join"
          className="font-mono-label rounded-xl bg-brand px-5 py-3 text-center text-sm font-bold uppercase text-white shadow-[0_10px_24px_-8px_rgba(79,70,229,0.55)]"
        >
          학생으로 참여하기
        </Link>
        <Link
          to="/teacher"
          className="font-mono-label rounded-xl border border-line bg-surface-1 px-5 py-3 text-center text-sm font-bold uppercase text-ink-dim"
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
