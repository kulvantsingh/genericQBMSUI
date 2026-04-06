import { useEffect, useRef, useState } from "react";
import crossIcon from "../../../../assets/ui/cross.png";
import { removeButtonStyle } from "../../utils/constants";
import { useLocalization } from "../../contexts/localizationContext";
import { Field } from "../controls/Field";
import { UndoIconButton, RedoIconButton } from "./UndoRedoButtons";
import { answerConfigHistoryActionsStyle, addTextButtonStyle, areStringArraysEqual, areNumberArraysEqual } from "./formHelpers";

export function MultiCorrectForm({ form, onPatch, isDark = false, sizeOffset = 0 }) {
  const { t } = useLocalization();
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const didLocalPatchRef = useRef(false);
  const nextOptionIdRef = useRef(1);
  const [optionIds, setOptionIds] = useState(() =>
    form.options.map(() => `multi-opt-${nextOptionIdRef.current++}`)
  );

  useEffect(() => {
    setOptionIds((previous) => {
      if (previous.length === form.options.length) return previous;
      if (previous.length > form.options.length) return previous.slice(0, form.options.length);
      const additions = Array.from(
        { length: form.options.length - previous.length },
        () => `multi-opt-${nextOptionIdRef.current++}`
      );
      return [...previous, ...additions];
    });
  }, [form.options.length]);

  useEffect(() => {
    if (!didLocalPatchRef.current) {
      setHistory([]);
      setFuture([]);
    }
    didLocalPatchRef.current = false;
  }, [form.options, form.correctAnswers]);

  const patchMultiCorrect = (nextValue, nextIds = optionIds) => {
    const nextOptions = nextValue.options ?? form.options;
    const nextCorrectAnswers = nextValue.correctAnswers ?? form.correctAnswers;

    if (areStringArraysEqual(nextOptions, form.options) && areNumberArraysEqual(nextCorrectAnswers, form.correctAnswers)) return;

    setHistory((previous) => [
      ...previous.slice(-59),
      { options: [...form.options], correctAnswers: [...form.correctAnswers], optionIds: [...optionIds] },
    ]);
    setFuture([]);
    didLocalPatchRef.current = true;
    setOptionIds(nextIds);
    onPatch({ options: nextOptions, correctAnswers: nextCorrectAnswers });
  };

  const undo = () => {
    setHistory((previous) => {
      if (previous.length === 0) return previous;
      const nextHistory = [...previous];
      const snapshot = nextHistory.pop();
      if (snapshot) {
        setFuture((upcoming) => [
          ...upcoming.slice(-59),
          { options: [...form.options], correctAnswers: [...form.correctAnswers], optionIds: [...optionIds] },
        ]);
        didLocalPatchRef.current = true;
        setOptionIds(snapshot.optionIds || optionIds);
        onPatch({ options: snapshot.options || [], correctAnswers: snapshot.correctAnswers || [] });
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
        setHistory((past) => [
          ...past.slice(-59),
          { options: [...form.options], correctAnswers: [...form.correctAnswers], optionIds: [...optionIds] },
        ]);
        didLocalPatchRef.current = true;
        setOptionIds(snapshot.optionIds || optionIds);
        onPatch({ options: snapshot.options || [], correctAnswers: snapshot.correctAnswers || [] });
      }
      return nextFuture;
    });
  };

  const setOption = (index, value) => {
    const options = [...form.options];
    options[index] = value;
    patchMultiCorrect({ options });
  };

  const toggle = (index) => {
    const correctAnswers = form.correctAnswers.includes(index)
      ? form.correctAnswers.filter((value) => value !== index)
      : [...form.correctAnswers, index];
    patchMultiCorrect({ correctAnswers });
  };

  const removeOption = (index) => {
    const options = form.options.filter((_, optionIndex) => optionIndex !== index);
    const nextIds = optionIds.filter((_, optionIndex) => optionIndex !== index);
    const correctAnswers = form.correctAnswers
      .filter((value) => value !== index)
      .map((value) => (value > index ? value - 1 : value));
    patchMultiCorrect({ options, correctAnswers }, nextIds);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative" }}>
      <div style={answerConfigHistoryActionsStyle}>
        <UndoIconButton onClick={undo} disabled={history.length === 0} isDark={isDark} />
        <RedoIconButton onClick={redo} disabled={future.length === 0} isDark={isDark} />
      </div>
      {form.options.map((option, index) => (
        <div key={optionIds[index] || `multi-fallback-${index}`} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => toggle(index)}
            style={{
              width: 22, height: 22, borderRadius: 6, cursor: "pointer", flexShrink: 0,
              border: `2px solid ${form.correctAnswers.includes(index) ? "var(--option-multi-accent)" : "var(--border-strong)"}`,
              background: form.correctAnswers.includes(index) ? "var(--option-multi-accent)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--option-multi-text)", fontWeight: 900, fontSize: 13 + sizeOffset,
            }}
          >
            {form.correctAnswers.includes(index) ? "✓" : ""}
          </button>
          <div style={{ flex: 1 }}>
            <Field value={option} onChange={(event) => setOption(index, event.target.value)} placeholder={`${t("Option ")}${String.fromCharCode(65 + index)}`} sizeOffset={sizeOffset} />
          </div>
          {form.options.length > 2 && (
            <button type="button" onClick={() => removeOption(index)} style={removeButtonStyle}>
              <img src={crossIcon} alt={t("Remove option")} aria-hidden="true" style={{ width: 16, height: 16, objectFit: "contain" }} />
            </button>
          )}
        </div>
      ))}
      {form.options.length < 8 && (
        <button
          type="button"
          onClick={() => {
            const nextIds = [...optionIds, `multi-opt-${nextOptionIdRef.current++}`];
            patchMultiCorrect({ options: [...form.options, ""] }, nextIds);
          }}
          style={addTextButtonStyle(sizeOffset)}
        >
          {t("+ Add Option")}
        </button>
      )}
    </div>
  );
}
