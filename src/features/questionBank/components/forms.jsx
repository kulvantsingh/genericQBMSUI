import { useEffect, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import undoIcon from "../../../assets/ui/return.png";
import redoIcon from "../../../assets/ui/redo.png";

import {
  CHILD_TYPES,
  TYPE_ICON,
  TYPE_LABEL,
  TYPES,
  removeButtonStyle,
} from "../constants";
import { createSubQuestion, sumSubQuestionPoints } from "../questionUtils";
import { Btn, Field } from "./common";

function UndoIconButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title="Undo"
      aria-label="Undo"
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        border: "none",
        background: "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
      }}
    >
      <img
        src={undoIcon}
        alt=""
        aria-hidden="true"
        style={{
          width: 24,
          height: 24,
          objectFit: "contain",
          // filter: "var(--type-icon-filter, none)",
        }}
      />
    </button>
  );
}

function RedoIconButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title="Redo"
      aria-label="Redo"
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        border: "none",
        background: "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
      }}
    >
      <img
        src={redoIcon}
        alt=""
        aria-hidden="true"
        style={{
          width: 24,
          height: 24,
          objectFit: "contain",
          // filter: "var(--type-icon-filter, none)",
        }}
      />
    </button>
  );
}

const areStringArraysEqual = (left, right) =>
  left.length === right.length && left.every((item, index) => item === right[index]);

const areNumberArraysEqual = (left, right) =>
  left.length === right.length && left.every((item, index) => item === right[index]);

function mapSubQuestionSingleAndMulti(fromType, toType, item) {
  const options =
    Array.isArray(item.options) && item.options.length > 0
      ? [...item.options]
      : ["", "", "", ""];

  const base = {
    type: toType,
    question: item.question || "",
    explanation: item.explanation || "",
    points: Math.max(1, Number(item.points) || 1),
    options,
  };

  if (toType === TYPES.MULTI_CORRECT) {
    const nextCorrectAnswers =
      fromType === TYPES.MCQ
        ? item.correctAnswer == null
          ? []
          : [item.correctAnswer]
        : Array.isArray(item.correctAnswers)
          ? item.correctAnswers
          : [];

    return {
      ...base,
      correctAnswers: [...new Set(nextCorrectAnswers)].filter(
        (index) => Number.isInteger(index) && index >= 0 && index < options.length
      ),
    };
  }

  const fallbackFromMulti =
    Array.isArray(item.correctAnswers) && item.correctAnswers.length > 0
      ? item.correctAnswers[0]
      : null;

  const nextCorrectAnswer =
    fromType === TYPES.MULTI_CORRECT ? fallbackFromMulti : item.correctAnswer ?? null;

  return {
    ...base,
    correctAnswer:
      Number.isInteger(nextCorrectAnswer) && nextCorrectAnswer >= 0 && nextCorrectAnswer < options.length
        ? nextCorrectAnswer
        : null,
  };
}

function MCQForm({ form, onPatch }) {
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
      nextValue.correctAnswer !== undefined
        ? nextValue.correctAnswer
        : form.correctAnswer;

    if (
      areStringArraysEqual(nextOptions, form.options) &&
      nextCorrectAnswer === form.correctAnswer
    ) {
      return;
    }

    setHistory((previous) => [
      ...previous.slice(-59),
      {
        options: [...form.options],
        correctAnswer: form.correctAnswer,
        optionIds: [...optionIds],
      },
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
          {
            options: [...form.options],
            correctAnswer: form.correctAnswer,
            optionIds: [...optionIds],
          },
        ]);
        didLocalPatchRef.current = true;
        setOptionIds(snapshot.optionIds || optionIds);
        onPatch({
          options: snapshot.options || [],
          correctAnswer: snapshot.correctAnswer ?? null,
        });
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
          {
            options: [...form.options],
            correctAnswer: form.correctAnswer,
            optionIds: [...optionIds],
          },
        ]);
        didLocalPatchRef.current = true;
        setOptionIds(snapshot.optionIds || optionIds);
        onPatch({
          options: snapshot.options || [],
          correctAnswer: snapshot.correctAnswer ?? null,
        });
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: -4 }}>
        <UndoIconButton onClick={undo} disabled={history.length === 0} />
        <RedoIconButton onClick={redo} disabled={future.length === 0} />
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
              placeholder={`Option ${String.fromCharCode(65 + index)}`}
            />
          </div>
          {form.options.length > 2 && (
            <button type="button" onClick={() => removeOption(index)} style={removeButtonStyle}>
              &#x274C;
            </button>
          )}
        </div>
      ))}
      {form.options.length < 8 && (
        <Btn
          small
          ghost
          onClick={() => {
            const nextIds = [...optionIds, `mcq-opt-${nextOptionIdRef.current++}`];
            patchMcq({ options: [...form.options, ""] }, nextIds);
          }}
        >
          + Add Option
        </Btn>
      )}
    </div>
  );
}

function TrueFalseForm({ form, onPatch }) {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      {[true, false].map((value) => (
        <button
          key={String(value)}
          type="button"
          onClick={() => onPatch({ correctAnswer: value })}
          style={{
            flex: 1,
            padding: 18,
            borderRadius: 14,
            fontWeight: 800,
            fontSize: 18,
            cursor: "pointer",
            border: `2px solid ${
              form.correctAnswer === value
                ? value
                  ? "var(--success)"
                  : "var(--danger)"
                : "var(--border-color)"
            }`,
            background:
              form.correctAnswer === value
                ? value
                  ? "color-mix(in srgb, var(--success) 16%, transparent)"
                  : "var(--danger-soft-bg)"
                : "var(--surface-alt-bg)",
            color:
              form.correctAnswer === value
                ? value
                  ? "var(--success)"
                  : "var(--danger)"
                : "var(--text-secondary)",
          }}
        >
          {value ? "TRUE" : "FALSE"}
        </button>
      ))}
    </div>
  );
}

function MultiCorrectForm({ form, onPatch }) {
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
      if (previous.length > form.options.length) {
        return previous.slice(0, form.options.length);
      }
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

    if (
      areStringArraysEqual(nextOptions, form.options) &&
      areNumberArraysEqual(nextCorrectAnswers, form.correctAnswers)
    ) {
      return;
    }

    setHistory((previous) => [
      ...previous.slice(-59),
      {
        options: [...form.options],
        correctAnswers: [...form.correctAnswers],
        optionIds: [...optionIds],
      },
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
          {
            options: [...form.options],
            correctAnswers: [...form.correctAnswers],
            optionIds: [...optionIds],
          },
        ]);
        didLocalPatchRef.current = true;
        setOptionIds(snapshot.optionIds || optionIds);
        onPatch({
          options: snapshot.options || [],
          correctAnswers: snapshot.correctAnswers || [],
        });
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
          {
            options: [...form.options],
            correctAnswers: [...form.correctAnswers],
            optionIds: [...optionIds],
          },
        ]);
        didLocalPatchRef.current = true;
        setOptionIds(snapshot.optionIds || optionIds);
        onPatch({
          options: snapshot.options || [],
          correctAnswers: snapshot.correctAnswers || [],
        });
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: -4 }}>
        <UndoIconButton onClick={undo} disabled={history.length === 0} />
        <RedoIconButton onClick={redo} disabled={future.length === 0} />
      </div>
      {form.options.map((option, index) => (
        <div key={optionIds[index] || `multi-fallback-${index}`} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => toggle(index)}
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              cursor: "pointer",
              flexShrink: 0,
              border: `2px solid ${
                form.correctAnswers.includes(index) ? "var(--option-multi-accent)" : "var(--border-strong)"
              }`,
              background: form.correctAnswers.includes(index) ? "var(--option-multi-accent)" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--option-multi-text)",
              fontWeight: 900,
              fontSize: 13,
            }}
          >
            {form.correctAnswers.includes(index) ? "&#21FF;" : ""}
          </button>
          <div style={{ flex: 1 }}>
            <Field
              value={option}
              onChange={(event) => setOption(index, event.target.value)}
              placeholder={`Option ${String.fromCharCode(65 + index)}`}
            />
          </div>
          {form.options.length > 2 && (
            <button type="button" onClick={() => removeOption(index)} style={removeButtonStyle}>
              &#x274C;
            </button>
          )}
        </div>
      ))}
      {form.options.length < 8 && (
        <Btn
          small
          ghost
          onClick={() => {
            const nextIds = [...optionIds, `multi-opt-${nextOptionIdRef.current++}`];
            patchMultiCorrect({ options: [...form.options, ""] }, nextIds);
          }}
        >
          + Add Option
        </Btn>
      )}
    </div>
  );
}

function SequenceSortableRow({
  id,
  index,
  option,
  optionsLength,
  setItem,
  removeItem,
  showDropHighlight,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        borderRadius: 10,
        padding: "4px 2px",
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.68 : 1,
        border: showDropHighlight
          ? "1px dashed color-mix(in srgb, var(--sequence-accent) 58%, transparent)"
          : "1px dashed transparent",
        background: showDropHighlight
          ? "color-mix(in srgb, var(--sequence-accent) 10%, transparent)"
          : "transparent",
      }}
    >
      <button
        type="button"
        title="Drag to reorder"
        aria-label={`Drag sequence item ${index + 1}`}
        {...attributes}
        {...listeners}
        style={{
          width: 24,
          border: "none",
          background: "transparent",
          color: "var(--text-muted)",
          cursor: "grab",
          fontSize: 13,
          lineHeight: 1,
          userSelect: "none",
          letterSpacing: 1,
          padding: 0,
          flexShrink: 0,
        }}
      >
        ||
      </button>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          background: "color-mix(in srgb, var(--sequence-accent) 22%, transparent)",
          color: "var(--sequence-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {index + 1}
      </div>
      <div style={{ flex: 1 }}>
        <Field
          value={option}
          onChange={(event) => setItem(index, event.target.value)}
          placeholder={`Sequence item ${index + 1}`}
        />
      </div>
      {optionsLength > 2 && (
        <button type="button" onClick={() => removeItem(index)} style={removeButtonStyle}>
          &#x274C;
        </button>
      )}
    </div>
  );
}

function ArrangeSequenceForm({ form, onPatch }) {
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const didLocalPatchRef = useRef(false);
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [itemIds, setItemIds] = useState(() =>
    form.options.map((_, index) => index + 1)
  );
  const nextIdRef = useRef(form.options.length + 1);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    setItemIds((previous) => {
      if (previous.length === form.options.length) return previous;

      if (previous.length < form.options.length) {
        const additions = Array.from(
          { length: form.options.length - previous.length },
          () => {
            const id = nextIdRef.current;
            nextIdRef.current += 1;
            return id;
          }
        );
        return [...previous, ...additions];
      }

      return previous.slice(0, form.options.length);
    });
  }, [form.options.length]);

  useEffect(() => {
    if (!didLocalPatchRef.current) {
      setHistory([]);
      setFuture([]);
    }
    didLocalPatchRef.current = false;
  }, [form.options]);

  const patchSequence = (nextOptions, nextIds = itemIds) => {
    if (
      areStringArraysEqual(nextOptions, form.options) &&
      areNumberArraysEqual(nextIds, itemIds)
    ) {
      return;
    }
    setHistory((previous) => [
      ...previous.slice(-59),
      { options: [...form.options], itemIds: [...itemIds] },
    ]);
    setFuture([]);
    didLocalPatchRef.current = true;
    setItemIds(nextIds);
    onPatch({ options: nextOptions });
  };

  const undo = () => {
    setHistory((previous) => {
      if (previous.length === 0) return previous;
      const nextHistory = [...previous];
      const snapshot = nextHistory.pop();
      if (snapshot) {
        setFuture((upcoming) => [
          ...upcoming.slice(-59),
          { options: [...form.options], itemIds: [...itemIds] },
        ]);
        didLocalPatchRef.current = true;
        setItemIds(snapshot.itemIds || itemIds);
        onPatch({ options: snapshot.options || [] });
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
          { options: [...form.options], itemIds: [...itemIds] },
        ]);
        didLocalPatchRef.current = true;
        setItemIds(snapshot.itemIds || itemIds);
        onPatch({ options: snapshot.options || [] });
      }
      return nextFuture;
    });
  };

  const setItem = (index, value) => {
    const options = [...form.options];
    options[index] = value;
    patchSequence(options);
  };

  const removeItem = (index) => {
    const nextIds = itemIds.filter((_, itemIndex) => itemIndex !== index);
    const options = form.options.filter((_, optionIndex) => optionIndex !== index);
    patchSequence(options, nextIds);
  };

  const addItem = () => {
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    const nextIds = [...itemIds, id];
    patchSequence([...form.options, ""], nextIds);
  };

  const sortableIds = itemIds;

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    setOverId(event.active.id);
  };

  const handleDragOver = (event) => {
    setOverId(event.over?.id ?? null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const fromIndex = itemIds.indexOf(active.id);
      const toIndex = itemIds.indexOf(over.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        const nextIds = arrayMove(itemIds, fromIndex, toIndex);
        const nextOptions = arrayMove(form.options, fromIndex, toIndex);
        patchSequence(nextOptions, nextIds);
      }
    }
    setActiveId(null);
    setOverId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: -4 }}>
        <UndoIconButton onClick={undo} disabled={history.length === 0} />
        <RedoIconButton onClick={redo} disabled={future.length === 0} />
      </div>
      <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>
        Enter the sequence items in the correct order. Students will arrange them in this order.
      </p>
      <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: -4 }}>
        Drag and drop to reorder items
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {form.options.map((option, index) => (
            <div key={itemIds[index]}>
              <SequenceSortableRow
                id={itemIds[index]}
                index={index}
                option={option}
                optionsLength={form.options.length}
                setItem={setItem}
                removeItem={removeItem}
                showDropHighlight={
                  overId === itemIds[index] &&
                  activeId !== null &&
                  activeId !== itemIds[index]
                }
              />
              {index < form.options.length - 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    color: "var(--sequence-accent)",
                    fontSize: 16,
                    opacity: 0.8,
                    marginTop: 2,
                  }}
                >
                  &#x2193;
                </div>
              )}
            </div>
          ))}
        </SortableContext>
      </DndContext>
      {form.options.length < 8 && (
        <Btn small ghost onClick={addItem}>
          + Add Item
        </Btn>
      )}
    </div>
  );
}

function MatchPairForm({ form, onPatch }) {
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const didLocalPatchRef = useRef(false);
  const nextPairIdRef = useRef(1);
  const [pairIds, setPairIds] = useState(() =>
    form.pairs.map(() => `pair-${nextPairIdRef.current++}`)
  );

  useEffect(() => {
    setPairIds((previous) => {
      if (previous.length === form.pairs.length) return previous;
      if (previous.length > form.pairs.length) {
        return previous.slice(0, form.pairs.length);
      }
      const additions = Array.from(
        { length: form.pairs.length - previous.length },
        () => `pair-${nextPairIdRef.current++}`
      );
      return [...previous, ...additions];
    });
  }, [form.pairs.length]);

  const clonePairs = (pairs) =>
    pairs.map((pair) => ({
      left: pair.left ?? "",
      right: pair.right ?? "",
    }));

  const arePairsEqual = (leftPairs, rightPairs) => {
    if (leftPairs.length !== rightPairs.length) return false;
    return leftPairs.every(
      (pair, index) =>
        (pair.left ?? "") === (rightPairs[index]?.left ?? "") &&
        (pair.right ?? "") === (rightPairs[index]?.right ?? "")
    );
  };

  useEffect(() => {
    if (!didLocalPatchRef.current) {
      setHistory([]);
      setFuture([]);
    }
    didLocalPatchRef.current = false;
  }, [form.pairs]);

  const patchPairs = (nextPairs, nextIds = pairIds) => {
    if (arePairsEqual(form.pairs, nextPairs) && areStringArraysEqual(nextIds, pairIds)) {
      return;
    }
    setHistory((previous) => [
      ...previous.slice(-59),
      { pairs: clonePairs(form.pairs), pairIds: [...pairIds] },
    ]);
    setFuture([]);
    didLocalPatchRef.current = true;
    setPairIds(nextIds);
    onPatch({ pairs: nextPairs });
  };

  const setPair = (index, side, value) => {
    const pairs = form.pairs.map((pair, pairIndex) =>
      pairIndex === index ? { ...pair, [side]: value } : pair
    );
    patchPairs(pairs);
  };

  const removePair = (index) => {
    const nextIds = pairIds.filter((_, pairIndex) => pairIndex !== index);
    patchPairs(form.pairs.filter((_, pairIndex) => pairIndex !== index), nextIds);
  };

  const addPair = () => {
    const nextIds = [...pairIds, `pair-${nextPairIdRef.current++}`];
    patchPairs([...form.pairs, { left: "", right: "" }], nextIds);
  };

  const undoPairEdit = () => {
    setHistory((previous) => {
      if (previous.length === 0) return previous;
      const nextHistory = [...previous];
      const previousPairs = nextHistory.pop();
      if (previousPairs) {
        setFuture((upcoming) => [
          ...upcoming.slice(-59),
          { pairs: clonePairs(form.pairs), pairIds: [...pairIds] },
        ]);
        didLocalPatchRef.current = true;
        setPairIds(previousPairs.pairIds || pairIds);
        onPatch({ pairs: previousPairs.pairs || [] });
      }
      return nextHistory;
    });
  };

  const redoPairEdit = () => {
    setFuture((previous) => {
      if (previous.length === 0) return previous;
      const nextFuture = [...previous];
      const nextPairs = nextFuture.pop();
      if (nextPairs) {
        setHistory((past) => [
          ...past.slice(-59),
          { pairs: clonePairs(form.pairs), pairIds: [...pairIds] },
        ]);
        didLocalPatchRef.current = true;
        setPairIds(nextPairs.pairIds || pairIds);
        onPatch({ pairs: nextPairs.pairs || [] });
      }
      return nextFuture;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: -4 }}>
        <UndoIconButton onClick={undoPairEdit} disabled={history.length === 0} />
        <RedoIconButton onClick={redoPairEdit} disabled={future.length === 0} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto", gap: 10 }}>
        <span style={{ color: "var(--brand-accent)", fontWeight: 700, fontSize: 13, textAlign: "center" }}>
          Column A
        </span>
        <span />
        <span style={{ color: "var(--brand-secondary)", fontWeight: 700, fontSize: 13, textAlign: "center" }}>
          Column B
        </span>
        <span />
      </div>
      {form.pairs.map((pair, index) => (
        <div
          key={pairIds[index] || `pair-fallback-${index}`}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr auto",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <Field
              value={pair.left}
              onChange={(event) => setPair(index, "left", event.target.value)}
              placeholder={`Term ${index + 1}`}
            />
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: 18 }}>&#x21FF;</span>
          <div style={{ minWidth: 0 }}>
            <Field
              value={pair.right}
              onChange={(event) => setPair(index, "right", event.target.value)}
              placeholder={`Definition ${index + 1}`}
            />
          </div>
          {form.pairs.length > 2 ? (
            <button
              type="button"
              onClick={() => removePair(index)}
              style={removeButtonStyle}
            >
              &#x274C;
            </button>
          ) : (
            <span />
          )}
        </div>
      ))}
      {form.pairs.length < 10 && (
        <Btn small ghost onClick={addPair}>
          + Add Pair
        </Btn>
      )}
    </div>
  );
}

export function AnswerConfiguration({ type, form, onPatch }) {
  if (type === TYPES.MCQ) return <MCQForm form={form} onPatch={onPatch} />;
  if (type === TYPES.TRUE_FALSE) return <TrueFalseForm form={form} onPatch={onPatch} />;
  if (type === TYPES.MULTI_CORRECT) return <MultiCorrectForm form={form} onPatch={onPatch} />;
  if (type === TYPES.ARRANGE_SEQUENCE) {
    return <ArrangeSequenceForm form={form} onPatch={onPatch} />;
  }
  if (type === TYPES.MATCH_PAIR) return <MatchPairForm form={form} onPatch={onPatch} />;
  return null;
}

function SubQuestionEditor({ item, index, onChange, onRemove }) {
  const toSingleMultiSnapshot = (source) => {
    const options =
      Array.isArray(source.options) && source.options.length > 0
        ? [...source.options]
        : ["", "", "", ""];

    return {
      type: source.type,
      question: source.question || "",
      explanation: source.explanation || "",
      points: Math.max(1, Number(source.points) || 1),
      options,
      correctAnswer:
        source.type === TYPES.MCQ && Number.isInteger(source.correctAnswer)
          ? source.correctAnswer
          : null,
      correctAnswers:
        source.type === TYPES.MULTI_CORRECT && Array.isArray(source.correctAnswers)
          ? [...source.correctAnswers]
          : [],
    };
  };

  const handleTypeChange = (nextType) => {
    onChange((currentItem) => {
      if (nextType === currentItem.type) return currentItem;

      const isCurrentSingleOrMulti =
        currentItem.type === TYPES.MCQ || currentItem.type === TYPES.MULTI_CORRECT;
      const isTargetSingleOrMulti =
        nextType === TYPES.MCQ || nextType === TYPES.MULTI_CORRECT;
      const currentSharedSnapshot = currentItem.__singleMultiShared || null;
      const nextSharedSnapshot = isCurrentSingleOrMulti
        ? toSingleMultiSnapshot(currentItem)
        : currentSharedSnapshot;
      let nextItem;

      if (isTargetSingleOrMulti) {
        if (nextSharedSnapshot) {
          if (nextSharedSnapshot.type === nextType) {
            nextItem = {
              ...createSubQuestion(nextType),
              ...nextSharedSnapshot,
              type: nextType,
            };
          } else {
            nextItem = {
              ...createSubQuestion(nextType),
              ...mapSubQuestionSingleAndMulti(
                nextSharedSnapshot.type,
                nextType,
                nextSharedSnapshot
              ),
            };
          }
        } else if (isCurrentSingleOrMulti) {
          nextItem = {
            ...createSubQuestion(nextType),
            ...mapSubQuestionSingleAndMulti(currentItem.type, nextType, currentItem),
          };
        } else {
          nextItem = createSubQuestion(nextType);
        }
      } else {
        nextItem = createSubQuestion(nextType);
      }

      return {
        ...nextItem,
        __uiId: currentItem.__uiId,
        __singleMultiShared: nextSharedSnapshot,
      };
    });
  };

  return (
    <div
      style={{
        border: "1px solid var(--border-color)",
        borderRadius: 16,
        padding: 18,
        background: "var(--surface-bg)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>Question {index + 1}</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {CHILD_TYPES.map((type) => {
              const isActive = item.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  title={TYPE_LABEL[type]}
                  aria-label={TYPE_LABEL[type]}
                  aria-pressed={isActive}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    border: `1px solid ${
                      isActive
                        ? "color-mix(in srgb, var(--brand-primary) 56%, var(--border-color) 44%)"
                        : "var(--border-color)"
                    }`,
                    background: isActive
                      ? "color-mix(in srgb, var(--brand-primary) 14%, var(--surface-bg) 86%)"
                      : "var(--surface-bg)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isActive ? "default" : "pointer",
                    padding: 0,
                  }}
                >
                  <img
                    src={TYPE_ICON[type]}
                    alt=""
                    aria-hidden="true"
                    style={{
                      width: 20,
                      height: 20,
                      objectFit: "contain",
                      filter: "var(--type-icon-filter, none)",
                    }}
                  />
                </button>
              );
            })}
          </div>
          <Btn small danger onClick={onRemove}>
            Remove
          </Btn>
        </div>
      </div>

      <Field
        label="Question *"
        as="textarea"
        rows={2}
        value={item.question}
        onChange={(event) =>
          onChange((currentItem) => ({ ...currentItem, question: event.target.value }))
        }
        placeholder="Enter the related question..."
      />

      <div style={{ background: "var(--surface-bg)", borderRadius: 14, padding: "16px 18px" }}>
        <div
          style={{
            color: "var(--text-secondary)",
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Answer Configuration
        </div>
        <AnswerConfiguration
          type={item.type}
          form={item}
          onPatch={(patch) => onChange((currentItem) => ({ ...currentItem, ...patch }))}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 16 }}>
        <Field
          label="Points"
          type="number"
          value={item.points}
          onChange={(event) =>
            onChange((currentItem) => ({
              ...currentItem,
              points: Math.max(1, parseInt(event.target.value, 10) || 1),
            }))
          }
        />
        <Field
          label="Explanation"
          as="textarea"
          rows={2}
          value={item.explanation}
          onChange={(event) =>
            onChange((currentItem) => ({
              ...currentItem,
              explanation: event.target.value,
            }))
          }
          placeholder="Optional explanation for this sub-question..."
        />
      </div>
    </div>
  );
}

export function ComprehensiveForm({ form, onPatch }) {
  const subQuestions = form.subQuestions || [];
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const didLocalPatchRef = useRef(false);
  const nextSubQuestionIdRef = useRef(1);
  const subQuestionsRef = useRef(subQuestions);

  const cloneSubQuestions = (items) =>
    JSON.parse(JSON.stringify(items || []));

  const areSubQuestionsEqual = (leftItems, rightItems) =>
    JSON.stringify(leftItems || []) === JSON.stringify(rightItems || []);

  const ensureSubQuestionIds = (items) =>
    (items || []).map((item) =>
      item.__uiId
        ? item
        : {
            ...item,
            __uiId: `subq-${nextSubQuestionIdRef.current++}`,
          }
    );

  useEffect(() => {
    subQuestionsRef.current = subQuestions;
    const maxExistingId = (subQuestions || []).reduce((maxValue, item) => {
      const match = /^subq-(\d+)$/.exec(item.__uiId || "");
      return match ? Math.max(maxValue, Number(match[1])) : maxValue;
    }, 0);

    if (maxExistingId >= nextSubQuestionIdRef.current) {
      nextSubQuestionIdRef.current = maxExistingId + 1;
    }
  }, [subQuestions]);

  useEffect(() => {
    if (!didLocalPatchRef.current) {
      setHistory([]);
      setFuture([]);
    }
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
    setHistory((previous) => [
      ...previous.slice(-59),
      cloneSubQuestions(currentSubQuestions),
    ]);
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
        const currentSubQuestions = subQuestionsRef.current || [];
        setFuture((upcoming) => [
          ...upcoming.slice(-59),
          cloneSubQuestions(currentSubQuestions),
        ]);
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
        const currentSubQuestions = subQuestionsRef.current || [];
        setHistory((past) => [
          ...past.slice(-59),
          cloneSubQuestions(currentSubQuestions),
        ]);
        didLocalPatchRef.current = true;
        subQuestionsRef.current = snapshot;
        onPatch({ subQuestions: snapshot });
      }
      return nextFuture;
    });
  };

  const updateSubQuestion = (targetId, fallbackIndex, valueOrUpdater) => {
    const currentSubQuestions = subQuestionsRef.current || [];
    patchSubQuestions(
      currentSubQuestions.map((entry, itemIndex) => {
        const isMatch = targetId ? entry.__uiId === targetId : itemIndex === fallbackIndex;
        if (!isMatch) return entry;
        return typeof valueOrUpdater === "function"
          ? valueOrUpdater(entry)
          : valueOrUpdater;
      })
    );
  };

  const removeSubQuestion = (targetId, fallbackIndex) => {
    const currentSubQuestions = subQuestionsRef.current || [];
    patchSubQuestions(
      currentSubQuestions.filter(
        (entry, itemIndex) =>
          targetId ? entry.__uiId !== targetId : itemIndex !== fallbackIndex
      )
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: -6 }}>
        <UndoIconButton onClick={undo} disabled={history.length === 0} />
        <RedoIconButton onClick={redo} disabled={future.length === 0} />
      </div>

      <div
        style={{
          padding: "14px 16px",
          borderRadius: 14,
          background: "color-mix(in srgb, var(--surface-alt-bg) 82%, var(--brand-soft) 18%)",
          border: "1px solid color-mix(in srgb, var(--border-color) 68%, var(--brand-accent) 32%)",
          color: "color-mix(in srgb, var(--text-primary) 78%, var(--brand-primary) 22%)",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        One common statement can have many child questions. Total points are the sum
        of all child questions.
      </div>

      {subQuestions.map((item, index) => (
        <SubQuestionEditor
          key={item.__uiId || index}
          item={item}
          index={index}
          onChange={(value) => updateSubQuestion(item.__uiId, index, value)}
          onRemove={() => removeSubQuestion(item.__uiId, index)}
        />
      ))}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <Btn
          ghost
          onClick={() => patchSubQuestions([...(subQuestionsRef.current || []), createSubQuestion()])}
        >
          + Add Sub-question
        </Btn>
        <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          Total points: {sumSubQuestionPoints(subQuestions)}
        </div>
      </div>
    </div>
  );
}
