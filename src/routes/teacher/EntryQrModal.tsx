import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { GhostButton, PrimaryButton } from "../../components/ui";

export function EntryQrModal({ code, onClose }: { code: string; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const joinUrl = new URL("join", new URL(import.meta.env.BASE_URL, window.location.origin)).href;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const controls = panelRef.current?.querySelectorAll<HTMLElement>("button, a[href], input");
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [onClose]);

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(`${label} 복사 완료`);
    } catch {
      setCopyStatus(`복사하지 못했어요. ${label}를 선택해 직접 복사해 주세요.`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-qr-title"
        className="glass-card max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-2xl p-5 sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="entry-qr-title" className="font-display text-2xl font-bold text-ink sm:text-3xl">학생 입장 QR</h2>
          </div>
          <GhostButton onClick={onClose}>닫기</GhostButton>
        </div>
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-xl border border-line bg-white">
            <QRCodeSVG value={joinUrl} size={360} level="M" marginSize={4} title="학생 입장 링크 QR 코드" className="h-auto w-full" />
          </div>
          <div className="min-w-0 space-y-5">
            <p className="break-keep text-lg font-semibold leading-relaxed text-ink">QR을 스캔한 뒤 아래 참여 코드를 입력하세요.</p>
            <div className="rounded-xl border border-brand/20 bg-brand-dim p-4">
              <p className="text-sm text-brand-ink">참여 코드 (PIN)</p>
              <p className="font-display my-2 select-all text-6xl font-extrabold tracking-[0.12em] text-brand-ink">{code}</p>
              <GhostButton tone="brand" onClick={() => void copyValue(code, "참여 코드")}>코드 복사</GhostButton>
            </div>
            <div>
              <label htmlFor="entry-join-link" className="mb-2 block text-sm font-semibold text-ink">학생 접속 링크</label>
              <input id="entry-join-link" readOnly value={joinUrl} onFocus={(event) => event.currentTarget.select()} className="w-full rounded-lg border border-line bg-surface-1 px-3 py-2 text-sm text-ink" />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <PrimaryButton onClick={() => void copyValue(joinUrl, "링크")}>링크 복사</PrimaryButton>
                <a href={joinUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-ink underline underline-offset-4">입장 화면 열기 ↗</a>
              </div>
              <p className="mt-3 break-keep text-sm leading-relaxed text-ink-dim">QR을 사용할 수 없으면 링크를 공유해 주세요. 모둠당 기기 1대로 접속하면 됩니다.</p>
            </div>
            <p role="status" className="min-h-5 text-sm text-brand-ink">{copyStatus}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
