import { useLocalization } from "../../contexts/localizationContext";
import { CHILD_TYPES, TYPE_ICON, TYPE_LABEL, TYPES } from "../../utils/constants";
import { createSubQuestion } from "../../utils/questionUtils";
import { Btn } from "../controls/Btn";
import { Field } from "../controls/Field";
import { AnswerConfiguration } from "./AnswerConfiguration";
import { mapSubQuestionSingleAndMulti } from "./formHelpers";

export function SubQuestionEditor({ item, index, onChange, onRemove, isDark = false, sizeOffset = 0 }) {
  const { t } = useLocalization();

  const toSingleMultiSnapshot = (source) => {
    const options = Array.isArray(source.options) && source.options.length > 0 ? [...source.options] : ["", "", "", ""];
    return {
      type: source.type,
      question: source.question || "",
      explanation: source.explanation || "",
      points: Math.max(1, Number(source.points) || 1),
      options,
      correctAnswer: source.type === TYPES.MCQ && Number.isInteger(source.correctAnswer) ? source.correctAnswer : null,
      correctAnswers: source.type === TYPES.MULTI_CORRECT && Array.isArray(source.correctAnswers) ? [...source.correctAnswers] : [],
    };
  };

  const handleTypeChange = (nextType) => {
    onChange((currentItem) => {
      if (nextType === currentItem.type) return currentItem;
      const isCurrentSingleOrMulti = currentItem.type === TYPES.MCQ || currentItem.type === TYPES.MULTI_CORRECT;
      const isTargetSingleOrMulti = nextType === TYPES.MCQ || nextType === TYPES.MULTI_CORRECT;
      const currentSharedSnapshot = currentItem.__singleMultiShared || null;
      const nextSharedSnapshot = isCurrentSingleOrMulti ? toSingleMultiSnapshot(currentItem) : currentSharedSnapshot;
      let nextItem;

      if (isTargetSingleOrMulti) {
        if (nextSharedSnapshot) {
          if (nextSharedSnapshot.type === nextType) {
            nextItem = { ...createSubQuestion(nextType), ...nextSharedSnapshot, type: nextType };
          } else {
            nextItem = { ...createSubQuestion(nextType), ...mapSubQuestionSingleAndMulti(nextSharedSnapshot.type, nextType, nextSharedSnapshot) };
          }
        } else if (isCurrentSingleOrMulti) {
          nextItem = { ...createSubQuestion(nextType), ...mapSubQuestionSingleAndMulti(currentItem.type, nextType, currentItem) };
        } else {
          nextItem = createSubQuestion(nextType);
        }
      } else {
        nextItem = createSubQuestion(nextType);
      }

      return { ...nextItem, __uiId: currentItem.__uiId, __singleMultiShared: nextSharedSnapshot };
    });
  };

  return (
    <div style={{ border: "1px solid var(--border-color)", borderRadius: 16, padding: 18, background: "var(--surface-bg)", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16 + sizeOffset }}>{t("Question ")}{index + 1}</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {CHILD_TYPES.map((type) => {
              const isActive = item.type === type;
              return (
                <button key={type} type="button" onClick={() => handleTypeChange(type)} title={t(TYPE_LABEL[type])} aria-label={t(TYPE_LABEL[type])} aria-pressed={isActive}
                  style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${isActive ? "color-mix(in srgb, var(--brand-primary) 56%, var(--border-color) 44%)" : "var(--border-color)"}`, background: isActive ? "color-mix(in srgb, var(--brand-primary) 14%, var(--surface-bg) 86%)" : "var(--surface-bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: isActive ? "default" : "pointer", padding: 0 }}>
                  <img src={TYPE_ICON[type]} alt="" aria-hidden="true" style={{ width: 20, height: 20, objectFit: "contain", filter: "var(--type-icon-filter, none)" }} />
                </button>
              );
            })}
          </div>
          <Btn small danger sizeOffset={sizeOffset} onClick={onRemove}>{t("Remove")}</Btn>
        </div>
      </div>

      <Field label={t("Question *")} as="textarea" rows={2} value={item.question} onChange={(event) => onChange((currentItem) => ({ ...currentItem, question: event.target.value }))} placeholder={t("Enter the related question...")} sizeOffset={sizeOffset} />

      <div style={{ background: "var(--surface-bg)", borderRadius: 14, padding: "16px 18px" }}>
        <div style={{ color: "var(--text-secondary)", fontSize: 12 + sizeOffset, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>{t("Answer Configuration")}</div>
        <AnswerConfiguration type={item.type} form={item} isDark={isDark} sizeOffset={sizeOffset} onPatch={(patch) => onChange((currentItem) => ({ ...currentItem, ...patch }))} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 16 }}>
        <Field label={t("Points")} type="number" value={item.points} onChange={(event) => onChange((currentItem) => ({ ...currentItem, points: Math.max(1, parseInt(event.target.value, 10) || 1) }))} sizeOffset={sizeOffset} />
        <Field label={t("Explanation")} as="textarea" rows={2} value={item.explanation} onChange={(event) => onChange((currentItem) => ({ ...currentItem, explanation: event.target.value }))} placeholder={t("Optional explanation for this sub-question...")} sizeOffset={sizeOffset} />
      </div>
    </div>
  );
}
