import { useEffect, useRef, useState } from "react";
import crossIcon from "../../../../assets/ui/cross.png";
import { removeButtonStyle } from "../../utils/constants";
import { useLocalization } from "../../contexts/localizationContext";
import { Field } from "../controls/Field";
import { UndoIconButton, RedoIconButton } from "./UndoRedoButtons";
import { answerConfigHistoryActionsStyle, addTextButtonStyle, areStringArraysEqual } from "./formHelpers";

export function MCQForm({ form, onPatch, isDark = false, sizeOffset = 0 }) {
  const { t } = useLocalization();
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const didLocalPatchRef = useRef(false);
  const nextOptionIdRef = useRef(1);
  const [optionIds, setOptionIds] = useState(() =>
    form.options.map(() => `mcq-opt-${nextOptionIdRef.current++}`)
  );

  useEffect(() => {
    setOptionIds((previous) => {
      if (previous.length === form.options.length) return previous;
      if (previous.length > form.options.length) {
        return previous.slice(0, form.options.length);
      }
      const additions = Array.from(
        { length: form.options.length - previous.length },
        () => `mcq-opt-${nextOptionIdRef.current++}`
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
  }, [form.options, form.correctAnswer]);

  const patchMcq = (nextValue, nextIds = optionIds) => {
    const nextOptions = nextValue.options ?? form.options;
    const nextCorrectAnswer =
      nextValue.correctAnswer !== undefined ? nextValue.correctAnswer : form.correctAnswer;

    if (areStringArraysEqual(nextOptions, form.options) && nextCorrectAnswer === form.correctAnswer) {
      return;
    }

    setHistory((previous) => [
      ...previous.slice(-59),
      { options: [...form.options], correctAnswer: form.correctAnswer, optionIds: [...optionIds] },
    ]);
    setFuture([]);
    didLocalPatchRef.current = true;
    setOptionIds(nextIds);
    onPatch({ options: nextOptions, correctAnswer: nextCorrectAnswer });
  };

  const undo = () => {
    setHistory((previous) => {
      if (previous.length === 0) return previous;
      const nextHistory = [...previous];
      const snapshot = nextHistory.pop();
      if (snapshot) {
        setFuture((upcoming) => [
          ...upcoming.slice(-59),
          { options: [...form.options], correctAnswer: form.correctAnswer, optionIds: [...optionIds] },
        ]);
        didLocalPatchRef.current = true;
        setOptionIds(snapshot.optionIds || optionIds);
        onPatch({ options: snapshot.options || [], correctAnswer: snapshot.correctAnswer ?? null });
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
          { options: [...form.options], correctAnswer: form.correctAnswer, optionIds: [...optionIds] },
        ]);
        didLocalPatchRef.current = true;
        setOptionIds(snapshot.optionIds || optionIds);
        onPatch({ options: snapshot.options || [], correctAnswer: snapshot.correctAnswer ?? null });
      }
      return nextFuture;
    });
  };

  const setOption = (index, value) => {
    const options = [...form.options];
    options[index] = value;
    patchMcq({ options });
  };

  const removeOption = (index) => {
    const options = form.options.filter((_, optionIndex) => optionIndex !== index);
    const nextIds = optionIds.filter((_, optionIndex) => optionIndex !== index);
    const correctAnswer =
      form.correctAnswer === index
        ? null
        : form.correctAnswer > index
          ? form.correctAnswer - 1
          : form.correctAnswer;
    patchMcq({ options, correctAnswer }, nextIds);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative" }}>
      <div style={answerConfigHistoryActionsStyle}>
        <UndoIconButton onClick={undo} disabled={history.length === 0} isDark={isDark} />
        <RedoIconButton onClick={redo} disabled={future.length === 0} isDark={isDark} />
      </div>
      {form.options.map((option, index) => (
        <div key={optionIds[index] || `mcq-fallback-${index}`} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => patchMcq({ correctAnswer: index })}
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: `2px solid ${form.correctAnswer === index ? "var(--option-single-accent)" : "var(--border-strong)"}`,
              background: form.correctAnswer === index ? "var(--option-single-accent)" : "transparent",
              cursor: "pointer",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <Field
              value={option}
              onChange={(event) => setOption(index, event.target.value)}
              placeholder={`${t("Option ")}${String.fromCharCode(65 + index)}`}
              sizeOffset={sizeOffset}
            />
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
            const nextIds = [...optionIds, `mcq-opt-${nextOptionIdRef.current++}`];
            patchMcq({ options: [...form.options, ""] }, nextIds);
          }}
          style={addTextButtonStyle(sizeOffset)}
        >
          {t("+ Add Option")}
        </button>
      )}
    </div>
  );
}
