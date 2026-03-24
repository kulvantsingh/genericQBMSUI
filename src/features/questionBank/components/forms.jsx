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

import {
  CHILD_TYPES,
  TYPE_LABEL,
  TYPES,
  removeButtonStyle,
} from "../constants";
import { createSubQuestion, sumSubQuestionPoints } from "../questionUtils";
import { Btn, Field } from "./common";

function MCQForm({ form, onPatch }) {
  const setOption = (index, value) => {
    const options = [...form.options];
    options[index] = value;
    onPatch({ options });
  };

  const removeOption = (index) => {
    const options = form.options.filter((_, optionIndex) => optionIndex !== index);
    const correctAnswer =
      form.correctAnswer === index
        ? null
        : form.correctAnswer > index
          ? form.correctAnswer - 1
          : form.correctAnswer;
    onPatch({ options, correctAnswer });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {form.options.map((option, index) => (
        <div key={index} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => onPatch({ correctAnswer: index })}
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
        <Btn small ghost onClick={() => onPatch({ options: [...form.options, ""] })}>
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
  const setOption = (index, value) => {
    const options = [...form.options];
    options[index] = value;
    onPatch({ options });
  };

  const toggle = (index) => {
    const correctAnswers = form.correctAnswers.includes(index)
      ? form.correctAnswers.filter((value) => value !== index)
      : [...form.correctAnswers, index];
    onPatch({ correctAnswers });
  };

  const removeOption = (index) => {
    const options = form.options.filter((_, optionIndex) => optionIndex !== index);
    const correctAnswers = form.correctAnswers
      .filter((value) => value !== index)
      .map((value) => (value > index ? value - 1 : value));
    onPatch({ options, correctAnswers });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {form.options.map((option, index) => (
        <div key={index} style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
        <Btn small ghost onClick={() => onPatch({ options: [...form.options, ""] })}>
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

  const setItem = (index, value) => {
    const options = [...form.options];
    options[index] = value;
    onPatch({ options });
  };

  const removeItem = (index) => {
    setItemIds((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
    const options = form.options.filter((_, optionIndex) => optionIndex !== index);
    onPatch({ options });
  };

  const addItem = () => {
    setItemIds((previous) => {
      const id = nextIdRef.current;
      nextIdRef.current += 1;
      return [...previous, id];
    });
    onPatch({ options: [...form.options, ""] });
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
        setItemIds((previous) => arrayMove(previous, fromIndex, toIndex));
        onPatch({ options: arrayMove(form.options, fromIndex, toIndex) });
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
  const setPair = (index, side, value) => {
    const pairs = form.pairs.map((pair, pairIndex) =>
      pairIndex === index ? { ...pair, [side]: value } : pair
    );
    onPatch({ pairs });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
          key={index}
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
              onClick={() =>
                onPatch({
                  pairs: form.pairs.filter((_, pairIndex) => pairIndex !== index),
                })
              }
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
        <Btn
          small
          ghost
          onClick={() => onPatch({ pairs: [...form.pairs, { left: "", right: "" }] })}
        >
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
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ minWidth: 180 }}>
            <Field
              as="select"
              value={item.type}
              onChange={(event) => {
                const nextType = event.target.value;
                const nextItem = createSubQuestion(nextType);
                onChange({
                  ...nextItem,
                  explanation: item.explanation || "",
                  points: item.points || 1,
                });
              }}
            >
              {CHILD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABEL[type]}
                </option>
              ))}
            </Field>
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
        onChange={(event) => onChange({ ...item, question: event.target.value })}
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
          onPatch={(patch) => onChange({ ...item, ...patch })}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 16 }}>
        <Field
          label="Points"
          type="number"
          value={item.points}
          onChange={(event) =>
            onChange({
              ...item,
              points: Math.max(1, parseInt(event.target.value, 10) || 1),
            })
          }
        />
        <Field
          label="Explanation"
          as="textarea"
          rows={2}
          value={item.explanation}
          onChange={(event) => onChange({ ...item, explanation: event.target.value })}
          placeholder="Optional explanation for this sub-question..."
        />
      </div>
    </div>
  );
}

export function ComprehensiveForm({ form, onPatch }) {
  const subQuestions = form.subQuestions || [];

  const updateSubQuestion = (index, value) => {
    onPatch({
      subQuestions: subQuestions.map((item, itemIndex) => (itemIndex === index ? value : item)),
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
          key={index}
          item={item}
          index={index}
          onChange={(value) => updateSubQuestion(index, value)}
          onRemove={() =>
            onPatch({
              subQuestions: subQuestions.filter((_, itemIndex) => itemIndex !== index),
            })
          }
        />
      ))}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <Btn ghost onClick={() => onPatch({ subQuestions: [...subQuestions, createSubQuestion()] })}>
          + Add Sub-question
        </Btn>
        <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          Total points: {sumSubQuestionPoints(subQuestions)}
        </div>
      </div>
    </div>
  );
}
