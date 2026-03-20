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
              border: `2px solid ${form.correctAnswer === index ? "#00e5a0" : "#2a3060"}`,
              background: form.correctAnswer === index ? "#00e5a0" : "transparent",
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
              x
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
                  ? "#00e5a0"
                  : "#ff3b5c"
                : "var(--border-color)"
            }`,
            background:
              form.correctAnswer === value
                ? value
                  ? "#00e5a022"
                  : "#ff3b5c22"
                : "var(--surface-alt-bg)",
            color:
              form.correctAnswer === value
                ? value
                  ? "#00e5a0"
                  : "#ff3b5c"
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
                form.correctAnswers.includes(index) ? "#ff9f43" : "#2a3060"
              }`,
              background: form.correctAnswers.includes(index) ? "#ff9f43" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0a0e1a",
              fontWeight: 900,
              fontSize: 13,
            }}
          >
            {form.correctAnswers.includes(index) ? "x" : ""}
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
              x
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

function ArrangeSequenceForm({ form, onPatch }) {
  const setItem = (index, value) => {
    const options = [...form.options];
    options[index] = value;
    onPatch({ options });
  };

  const removeItem = (index) => {
    const options = form.options.filter((_, optionIndex) => optionIndex !== index);
    onPatch({ options });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>
        Enter the sequence items in the correct order. Students will arrange them in this order.
      </p>
      {form.options.map((option, index) => (
        <div key={index} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background: "#ffd16622",
              color: "#ffd166",
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
          {form.options.length > 2 && (
            <button type="button" onClick={() => removeItem(index)} style={removeButtonStyle}>
              x
            </button>
          )}
        </div>
      ))}
      {form.options.length < 8 && (
        <Btn small ghost onClick={() => onPatch({ options: [...form.options, ""] })}>
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
        <span style={{ color: "#ff6b9d", fontWeight: 700, fontSize: 13, textAlign: "center" }}>
          Column A
        </span>
        <span />
        <span style={{ color: "#7c6aff", fontWeight: 700, fontSize: 13, textAlign: "center" }}>
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
          <span style={{ color: "var(--text-muted)", fontSize: 18 }}>=</span>
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
              x
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
        background: "var(--surface-alt-bg)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>Sub-question {index + 1}</div>
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
        label="Question Text *"
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
          background: "color-mix(in srgb, var(--surface-alt-bg) 75%, #4cc9f0 12%)",
          border: "1px solid color-mix(in srgb, var(--border-color) 70%, #4cc9f0 30%)",
          color: "color-mix(in srgb, var(--text-primary) 72%, #4cc9f0 28%)",
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
