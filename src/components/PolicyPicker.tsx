import { POLICY_CATEGORIES, optionLabel } from "../data/policies";
import type { PolicyChoice, PolicyCategoryId } from "../types";
import { Card, PrimaryButton } from "./ui";
import { useTeamActions } from "./teamActionsContext";

const CHANGE_LABEL: Record<PolicyCategoryId, string> = { tax: "세금", budget: "예산", wage: "최저임금" };

export function PolicyPicker({
  value,
  onChange,
  onSubmit,
  submitLabel,
  previousChoice,
  saved = true,
  saveError = false,
}: {
  value: PolicyChoice;
  onChange: (next: PolicyChoice) => void;
  onSubmit: () => void;
  submitLabel: string;
  previousChoice?: PolicyChoice;
  saved?: boolean;
  saveError?: boolean;
}) {
  const { previewViewport } = useTeamActions();
  const desktopPreview = previewViewport === "desktop";
  const complete = Boolean(value.tax && value.budget && value.wage && value.reason?.trim());
  const isSubmitted = Boolean(value.submittedAt) && saved && !saveError;
  const submitting = Boolean(value.submittedAt) && !saved && !saveError;

  // value[c.id]가 아직 없으면(2차 설계를 막 시작해 새로 고르지 않은 상태) "미선택으로
  // 변경됨"처럼 보이는 오해를 막기 위해, 실제로 새로 고른 항목만 변경으로 표시한다.
  const changedCategories: PolicyCategoryId[] = previousChoice
    ? POLICY_CATEGORIES.filter((c) => previousChoice[c.id] && value[c.id] && previousChoice[c.id] !== value[c.id]).map((c) => c.id)
    : [];

  // 제출된 뒤 선택을 바꾸면 "제출됨" 표시가 그대로 남아있으면 안 된다 —
  // 다시 제출 버튼을 눌러야 진짜로 제출된 것이어야 한다.
  function select(categoryId: PolicyCategoryId, optionId: string) {
    onChange({ ...value, [categoryId]: optionId, submittedAt: null });
  }

  return (
    <div className="flex flex-col gap-3">
      {previousChoice && (
        <div
          role="status"
          aria-label="1차 설계 대비 정책 변경"
          tabIndex={0}
          className={`font-mono-label flex h-10 shrink-0 items-center gap-3 overflow-x-auto whitespace-nowrap rounded-lg border border-dashed px-3 text-[11px] focus-visible:outline-2 focus-visible:outline-brand ${changedCategories.length ? "border-warn bg-warn-bg text-warn" : "border-line bg-surface-2 text-ink-dim"}`}
        >
          {changedCategories.length ? changedCategories.map((categoryId, index) => (
            <span key={categoryId} className="shrink-0">
              {index > 0 && <span aria-hidden="true" className="mr-3 opacity-50">|</span>}
              {CHANGE_LABEL[categoryId]}: {optionLabel(categoryId, previousChoice[categoryId])} → {optionLabel(categoryId, value[categoryId])}
            </span>
          )) : <span>1차 설계와 비교 · 정책을 바꾸면 변경 내용이 여기에 표시됩니다.</span>}
        </div>
      )}

      {POLICY_CATEGORIES.map((category) => (
        <Card key={category.id} label={category.title}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {category.options.map((option) => {
              const selected = value[category.id] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => select(category.id, option.id)}
                  className={`flex flex-col gap-1 rounded-xl border p-2.5 text-left text-[11px] transition ${
                    selected ? "border-brand bg-brand-dim" : "border-line bg-surface-1 hover:border-line-strong"
                  }`}
                >
                  <span className="text-sm font-semibold text-ink">{option.label}</span>
                  <span className="break-keep text-[13px] leading-relaxed text-ink-dim">{option.description}</span>
                </button>
              );
            })}
          </div>
        </Card>
      ))}

      <Card key="reason" label="이 선택의 이유 · 필수">
        <textarea
          value={value.reason ?? ""}
          onChange={(e) => onChange({ ...value, reason: e.target.value, submittedAt: null })}
          placeholder="왜 이 조합을 골랐나요?"
          rows={2}
          className={`w-full resize-none rounded-lg border border-line bg-surface-0 p-2 ${desktopPreview ? "text-sm" : "text-[12.5px]"} text-ink outline-none focus:border-brand`}
        />
      </Card>

      {saveError && <p role="alert" className="text-[12px] text-crit">저장하지 못했습니다. 연결 상태를 확인하고 다시 제출해 주세요.</p>}
      {!saved && !saveError && <p role="status" className="text-[12px] text-ink-dim">{submitting ? "제출 내용을 저장하는 중…" : "저장 중…"}</p>}
      {isSubmitted ? (
        <div key="submit" className="flex items-center justify-between gap-2 rounded-xl border border-good bg-good-bg px-4 py-3">
          <span className="text-[12.5px] font-semibold text-good">제출 완료! 팀원과 함께 다음 단계를 기다려 주세요.</span>
        </div>
      ) : (
        <div key="submit" className="flex items-center justify-end">
          <PrimaryButton onClick={onSubmit} disabled={!complete || submitting}>
            {submitting ? "제출 중…" : submitLabel}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
