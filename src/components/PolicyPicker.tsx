import { POLICY_CATEGORIES, optionLabel } from "../data/policies";
import type { PolicyChoice, PolicyCategoryId } from "../types";
import { Card, PrimaryButton } from "./ui";

export function PolicyPicker({
  value,
  onChange,
  onSubmit,
  submitLabel,
  previousChoice,
}: {
  value: PolicyChoice;
  onChange: (next: PolicyChoice) => void;
  onSubmit: () => void;
  submitLabel: string;
  previousChoice?: PolicyChoice;
}) {
  const complete = Boolean(value.tax && value.budget && value.wage && value.reason?.trim());
  const isSubmitted = Boolean(value.submittedAt);

  // value[c.id]가 아직 없으면(2차 설계를 막 시작해 새로 고르지 않은 상태) "미선택으로
  // 변경됨"처럼 보이는 오해를 막기 위해, 실제로 새로 고른 항목만 변경으로 표시한다.
  const changedCategories: PolicyCategoryId[] = previousChoice
    ? POLICY_CATEGORIES.filter((c) => previousChoice[c.id] && value[c.id] && previousChoice[c.id] !== value[c.id]).map((c) => c.id)
    : [];

  // 제출된 뒤 선택을 바꾸면 "제출됨" 표시가 그대로 남아있으면 안 된다 —
  // 다시 제출 버튼을 눌러야 진짜로 제출된 것이어야 한다.
  function select(categoryId: PolicyCategoryId, optionId: string) {
    onChange({ ...value, [categoryId]: optionId, submittedAt: undefined });
  }

  return (
    <div className="flex flex-col gap-3">
      {changedCategories.map((categoryId) => {
        const category = POLICY_CATEGORIES.find((c) => c.id === categoryId)!;
        return (
          <div
            key={categoryId}
            className="font-mono-label rounded-lg border border-dashed border-warn bg-warn-bg px-3 py-2 text-[11px] text-warn"
          >
            {category.title}: {optionLabel(categoryId, previousChoice?.[categoryId])} → {optionLabel(categoryId, value[categoryId])}로 변경됨
          </div>
        );
      })}

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
                  <span className="text-[12px] font-semibold text-ink">{option.label}</span>
                  <span className="text-[10.5px] text-ink-dim">{option.description}</span>
                </button>
              );
            })}
          </div>
        </Card>
      ))}

      <Card key="reason" label="이 선택의 이유 · 필수">
        <textarea
          value={value.reason ?? ""}
          onChange={(e) => onChange({ ...value, reason: e.target.value, submittedAt: undefined })}
          placeholder="왜 이 조합을 골랐나요?"
          rows={2}
          className="w-full resize-none rounded-lg border border-line bg-surface-0 p-2 text-[12.5px] text-ink outline-none focus:border-brand"
        />
      </Card>

      {isSubmitted ? (
        <div key="submit" className="flex items-center justify-between gap-2 rounded-xl border border-good bg-good-bg px-4 py-3">
          <span className="text-[12.5px] font-semibold text-good">제출 완료! 팀원과 함께 다음 단계를 기다려 주세요.</span>
        </div>
      ) : (
        <div key="submit" className="flex items-center justify-end">
          <PrimaryButton onClick={onSubmit} disabled={!complete}>
            {submitLabel}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
