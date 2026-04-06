import { useEffect, useRef, useState } from "react";
import { useLocalization } from "../../contexts/localizationContext";
import { createSubQuestion } from "../../utils/questionUtils";
import { Btn } from "../controls/Btn";
import { SubQuestionEditor } from "./SubQuestionEditor";

export function ComprehensiveForm({ form, onPatch, isDark = false, sizeOffset = 0 }) {
  const { t } = useLocalization();
  const subQuestions = form.subQuestions || [];
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const didLocalPatchRef = useRef(false);
  const nextSubQuestionIdRef = useRef(1);
  const subQuestionsRef = useRef(subQuestions);

  const cloneSubQuestions = (items) => JSON.parse(JSON.stringify(items || []));
  const areSubQuestionsEqual = (leftItems, rightItems) => JSON.stringify(leftItems || []) === JSON.stringify(rightItems || []);
  const ensureSubQuestionIds = (items) =>
    (items || []).map((item) =>
      item.__uiId ? item : { ...item, __uiId: `subq-${nextSubQuestionIdRef.current++}` }
    );

  useEffect(() => {
    subQuestionsRef.current = subQuestions;
    const maxExistingId = (subQuestions || []).reduce((maxValue, item) => {
      const match = /^subq-(\d+)$/.exec(item.__uiId || "");
      return match ? Math.max(maxValue, Number(match[1])) : maxValue;
    }, 0);
    if (maxExistingId >= nextSubQuestionIdRef.current) nextSubQuestionIdRef.current = maxExistingId + 1;
  }, [subQuestions]);

  useEffect(() => {
    if (!didLocalPatchRef.current) { setHistory([]); setFuture([]); }
    didLocalPatchRef.current = false;
  }, [subQuestions]);

  useEffect(() => {
    const normalized = ensureSubQuestionIds(subQuestions);
    if (areSubQuestionsEqual(subQuestions, normalized)) return;
    didLocalPatchRef.current = true;
    subQuestionsRef.current = normalized;
    onPatch({ subQuestions: normalized });
  }, [onPatch, subQuestions]);

  const patchSubQuestions = (nextSubQuestions) => {
    const currentSubQuestions = subQuestionsRef.current || [];
    const normalizedNextSubQuestions = ensureSubQuestionIds(nextSubQuestions);
    if (areSubQuestionsEqual(currentSubQuestions, normalizedNextSubQuestions)) return;
    setHistory((previous) => [...previous.slice(-59), cloneSubQuestions(currentSubQuestions)]);
    setFuture([]);
    didLocalPatchRef.current = true;
    subQuestionsRef.current = normalizedNextSubQuestions;
    onPatch({ subQuestions: normalizedNextSubQuestions });
  };

  const undo = () => {
    setHistory((previous) => {
      if (previous.length === 0) return previous;
      const nextHistory = [...previous];
      const snapshot = nextHistory.pop();
      if (snapshot) {
        const current = subQuestionsRef.current || [];
        setFuture((upcoming) => [...upcoming.slice(-59), cloneSubQuestions(current)]);
        didLocalPatchRef.current = true;
        subQuestionsRef.current = snapshot;
        onPatch({ subQuestions: snapshot });
      }
      return nextHistory;
    });
  };

  const redo = () => {
    setFuture((previous) => {
      if (previous.length === 0) return previous;
      const nextFuture = [...previous];
      const snapshot = nextFuture.pop();
      if (snapshot) {
        const current = subQuestionsRef.current || [];
        setHistory((past) => [...past.slice(-59), cloneSubQuestions(current)]);
        didLocalPatchRef.current = true;
        subQuestionsRef.current = snapshot;
        onPatch({ subQuestions: snapshot });
      }
      return nextFuture;
    });
  };

  const updateSubQuestion = (targetId, fallbackIndex, valueOrUpdater) => {
    const current = subQuestionsRef.current || [];
    patchSubQuestions(
      current.map((entry, itemIndex) => {
        const isMatch = targetId ? entry.__uiId === targetId : itemIndex === fallbackIndex;
        if (!isMatch) return entry;
        return typeof valueOrUpdater === "function" ? valueOrUpdater(entry) : valueOrUpdater;
      })
    );
  };

  const removeSubQuestion = (targetId, fallbackIndex) => {
    const current = subQuestionsRef.current || [];
    patchSubQuestions(current.filter((entry, itemIndex) => targetId ? entry.__uiId !== targetId : itemIndex !== fallbackIndex));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ padding: "14px 16px", borderRadius: 14, background: "color-mix(in srgb, var(--surface-alt-bg) 82%, var(--brand-soft) 18%)", border: "1px solid color-mix(in srgb, var(--border-color) 68%, var(--brand-accent) 32%)", color: "color-mix(in srgb, var(--text-primary) 78%, var(--brand-primary) 22%)", fontSize: 13 + sizeOffset, lineHeight: 1.6 }}>
        {t("One common statement can have many child questions. Total points are the sum of all child questions.")}
      </div>

      {subQuestions.map((item, index) => (
        <SubQuestionEditor
          key={item.__uiId || index}
          item={item}
          index={index}
          isDark={isDark}
          sizeOffset={sizeOffset}
          onChange={(value) => updateSubQuestion(item.__uiId, index, value)}
          onRemove={() => removeSubQuestion(item.__uiId, index)}
        />
      ))}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <Btn ghost sizeOffset={sizeOffset} onClick={() => patchSubQuestions([...(subQuestionsRef.current || []), createSubQuestion()])}>
          {t("+ Add Sub-question")}
        </Btn>
      </div>
    </div>
  );
}
