import { createContext, useCallback, useContext, useEffect, useReducer, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  List,
  Link,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

const BASE_URL = "http://10.208.22.183:8082/api/v1/questions";

const TYPES = {
  MCQ: "mcq",
  TRUE_FALSE: "true_false",
  MULTI_CORRECT: "multi_correct",
  MATCH_PAIR: "match_pair",
  ARRANGE_SEQUENCE: "arrange_sequence",
  COMPREHENSIVE: "comprehensive",
};

const CHILD_TYPES = [
  TYPES.MCQ,
  TYPES.TRUE_FALSE,
  TYPES.MULTI_CORRECT,
  TYPES.MATCH_PAIR,
  TYPES.ARRANGE_SEQUENCE,
];

const TYPE_LABEL = {
  mcq: "Multiple Choice",
  true_false: "True / False",
  multi_correct: "Multi-Correct",
  match_pair: "Match the Pair",
  arrange_sequence: "Arrange the Sequence",
  comprehensive: "Comprehensive",
};

const TYPE_ICON = {
  mcq: "O",
  true_false: "T/F",
  multi_correct: "M",
  match_pair: "P",
  arrange_sequence: "S",
  comprehensive: "C",
};

const TYPE_COLOR = {
  mcq: "#7c6aff",
  true_false: "#00e5a0",
  multi_correct: "#ff9f43",
  match_pair: "#ff6b9d",
  arrange_sequence: "#ffd166",
  comprehensive: "#4cc9f0",
};

const DIFFS = ["Easy", "Medium", "Hard"];
const SUBJECTS = [
  "Mathematics",
  "Science",
  "History",
  "Geography",
  "Literature",
  "Computer Science",
  "General Knowledge",
  "Other",
];

const inputStyle = {
  flex: 1,
  background: "var(--input-bg)",
  border: "1px solid var(--border-color)",
  borderRadius: 10,
  padding: "10px 14px",
  color: "var(--text-primary)",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
};

const removeButtonStyle = {
  background: "none",
  border: "none",
  color: "#ff3b5c",
  cursor: "pointer",
  fontSize: 18,
};

const pillStyle = {
  background: "var(--pill-bg)",
  color: "var(--text-secondary)",
  padding: "3px 10px",
  borderRadius: 20,
  fontSize: 12,
};

const EditorContext = createContext(null);

const THEME_VARS = {
  dark: {
    "--app-bg": "#0a0e1a",
    "--nav-bg": "#0d1021",
    "--surface-bg": "#13172b",
    "--surface-alt-bg": "#0d1021",
    "--surface-strong-bg": "#0f1424",
    "--border-color": "#1e2540",
    "--border-strong": "#24304f",
    "--text-primary": "#d4daf7",
    "--text-secondary": "#7a84a8",
    "--text-muted": "#4a5278",
    "--text-soft": "#9aa0c4",
    "--pill-bg": "#1e2540",
    "--input-bg": "#0d1021",
    "--editor-toolbar-bg": "#141b31",
    "--editor-bg": "#0d1324",
    "--editor-hover": "#24304f",
    "--scroll-track": "#0a0e1a",
    "--scroll-thumb": "#2a3060",
  },
  light: {
    "--app-bg": "#f4f7fb",
    "--nav-bg": "#ffffff",
    "--surface-bg": "#ffffff",
    "--surface-alt-bg": "#f7f9fc",
    "--surface-strong-bg": "#ffffff",
    "--border-color": "#d8e1ee",
    "--border-strong": "#c7d3e6",
    "--text-primary": "#172033",
    "--text-secondary": "#51607e",
    "--text-muted": "#73819d",
    "--text-soft": "#5e6d89",
    "--pill-bg": "#edf2fa",
    "--input-bg": "#ffffff",
    "--editor-toolbar-bg": "#eef3fa",
    "--editor-bg": "#ffffff",
    "--editor-hover": "#dfe8f5",
    "--scroll-track": "#eef3fa",
    "--scroll-thumb": "#c4d0e3",
  },
};

function stripHtml(value = "") {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const editorPlugins = [Essentials, Paragraph, Bold, Italic, Underline, List, Link];

function getEditorConfig(placeholder, compact = false) {
  return {
    licenseKey: "GPL",
    plugins: editorPlugins,
    toolbar: compact
      ? ["bold", "italic", "underline", "|", "bulletedList", "numberedList", "|", "undo", "redo"]
      : ["bold", "italic", "underline", "|", "bulletedList", "numberedList", "|", "link", "|", "undo", "redo"],
    placeholder,
  };
}

function sumSubQuestionPoints(subQuestions = []) {
  return subQuestions.reduce(
    (total, item) => total + Math.max(1, Number(item.points) || 1),
    0
  );
}

function createSubQuestion(type = TYPES.MCQ) {
  const base = {
    type,
    question: "",
    explanation: "",
    points: 1,
  };

  if (type === TYPES.MCQ) {
    return { ...base, options: ["", "", "", ""], correctAnswer: null };
  }

  if (type === TYPES.TRUE_FALSE) {
    return { ...base, correctAnswer: null };
  }

  if (type === TYPES.MULTI_CORRECT) {
    return { ...base, options: ["", "", "", ""], correctAnswers: [] };
  }

  if (type === TYPES.ARRANGE_SEQUENCE) {
    return { ...base, options: ["", "", "", ""] };
  }

  return {
    ...base,
    question: "Match the following:",
    pairs: [
      { left: "", right: "" },
      { left: "", right: "" },
      { left: "", right: "" },
    ],
  };
}

const blank = {
  mcq: () => ({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: null,
    explanation: "",
    points: 1,
  }),
  true_false: () => ({
    question: "",
    correctAnswer: null,
    explanation: "",
    points: 1,
  }),
  multi_correct: () => ({
    question: "",
    options: ["", "", "", ""],
    correctAnswers: [],
    explanation: "",
    points: 1,
  }),
  arrange_sequence: () => ({
    question: "",
    options: ["", "", "", ""],
    explanation: "",
    points: 1,
  }),
  match_pair: () => ({
    question: "Match the following:",
    pairs: [
      { left: "", right: "" },
      { left: "", right: "" },
      { left: "", right: "" },
    ],
    explanation: "",
    points: 1,
  }),
  comprehensive: () => ({
    question: "",
    explanation: "",
    subQuestions: [createSubQuestion()],
  }),
};

function buildSubQuestionPayload(item) {
  const base = {
    type: item.type,
    question: item.question,
    explanation: item.explanation || null,
    points: Math.max(1, Number(item.points) || 1),
    options: null,
    correctAnswer: null,
    pairs: null,
  };

  if (item.type === TYPES.MCQ) {
    return {
      ...base,
      options: (item.options || []).filter((option) => stripHtml(option)),
      correctAnswer: item.correctAnswer,
    };
  }

  if (item.type === TYPES.TRUE_FALSE) {
    return {
      ...base,
      correctAnswer: item.correctAnswer,
    };
  }

  if (item.type === TYPES.MULTI_CORRECT) {
    return {
      ...base,
      options: (item.options || []).filter((option) => stripHtml(option)),
      correctAnswer: item.correctAnswers || [],
    };
  }

  if (item.type === TYPES.ARRANGE_SEQUENCE) {
    const sequence = (item.options || []).filter((option) => stripHtml(option));
    return {
      ...base,
      options: sequence,
      correctAnswer: sequence,
    };
  }

  return {
    ...base,
    pairs: (item.pairs || []).filter(
      (pair) => stripHtml(pair.left) && stripHtml(pair.right)
    ),
  };
}

function buildPayload(type, form, meta) {
  const base = {
    type,
    question: form.question,
    explanation: form.explanation || null,
    points: form.points || 1,
    difficulty: meta.difficulty,
    subject: meta.subject,
    tags: meta.tags || null,
    options: null,
    correctAnswer: null,
    pairs: null,
    subQuestions: null,
  };

  if (type === TYPES.MCQ) {
    return {
      ...base,
      options: form.options.filter((option) => stripHtml(option)),
      correctAnswer: form.correctAnswer,
    };
  }

  if (type === TYPES.TRUE_FALSE) {
    return {
      ...base,
      correctAnswer: form.correctAnswer,
    };
  }

  if (type === TYPES.MULTI_CORRECT) {
    return {
      ...base,
      options: form.options.filter((option) => stripHtml(option)),
      correctAnswer: form.correctAnswers,
    };
  }

  if (type === TYPES.ARRANGE_SEQUENCE) {
    const sequence = form.options.filter((option) => stripHtml(option));
    return {
      ...base,
      options: sequence,
      correctAnswer: sequence,
    };
  }

  if (type === TYPES.MATCH_PAIR) {
    return {
      ...base,
      pairs: form.pairs.filter(
        (pair) => stripHtml(pair.left) && stripHtml(pair.right)
      ),
    };
  }

  if (type === TYPES.COMPREHENSIVE) {
    return {
      ...base,
      points: sumSubQuestionPoints(form.subQuestions),
      subQuestions: (form.subQuestions || []).map(buildSubQuestionPayload),
    };
  }

  return base;
}

function normaliseSubQuestion(item) {
  const next = {
    ...createSubQuestion(item.type || TYPES.MCQ),
    ...item,
    points: Math.max(1, Number(item.points) || 1),
  };

  if (next.type === TYPES.MULTI_CORRECT) {
    next.correctAnswers = Array.isArray(item.correctAnswer)
      ? item.correctAnswer
      : item.correctAnswers || [];
  }

  return next;
}

function normalise(question) {
  const next = { ...question };

  if (next.type === TYPES.MULTI_CORRECT) {
    next.correctAnswers = Array.isArray(next.correctAnswer)
      ? next.correctAnswer
      : [];
  }

  if (next.type === TYPES.ARRANGE_SEQUENCE) {
    next.options = Array.isArray(next.correctAnswer)
      ? next.correctAnswer
      : next.options || [];
  }

  if (next.type === TYPES.COMPREHENSIVE) {
    next.subQuestions = Array.isArray(next.subQuestions)
      ? next.subQuestions.map(normaliseSubQuestion)
      : [];
    next.points = next.points || sumSubQuestionPoints(next.subQuestions);
  }

  return next;
}

const validate = {
  mcq(form) {
    const errors = [];
    if (!stripHtml(form.question)) errors.push("Question required");
    if (form.options.filter((option) => stripHtml(option)).length < 2) errors.push("At least 2 options required");
    if (form.correctAnswer == null) errors.push("Select the correct answer");
    return errors;
  },
  true_false(form) {
    const errors = [];
    if (!stripHtml(form.question)) errors.push("Question required");
    if (form.correctAnswer == null) errors.push("Select True or False");
    return errors;
  },
  multi_correct(form) {
    const errors = [];
    if (!stripHtml(form.question)) errors.push("Question required");
    if (form.options.filter((option) => stripHtml(option)).length < 2) errors.push("At least 2 options required");
    if (!form.correctAnswers?.length) errors.push("Select at least 1 correct answer");
    return errors;
  },
  arrange_sequence(form) {
    const errors = [];
    if (!stripHtml(form.question)) errors.push("Question required");
    if (form.options.filter((option) => stripHtml(option)).length < 2) {
      errors.push("Enter at least 2 sequence items");
    }
    return errors;
  },
  match_pair(form) {
    const errors = [];
    if (!stripHtml(form.question)) errors.push("Question required");
    if (form.pairs.filter((pair) => stripHtml(pair.left) && stripHtml(pair.right)).length < 2) {
      errors.push("Need at least 2 complete pairs");
    }
    return errors;
  },
  comprehensive(form) {
    const errors = [];

    if (!stripHtml(form.question)) errors.push("Statement / passage required");
    if (!form.subQuestions?.length) errors.push("Add at least 1 related question");

    (form.subQuestions || []).forEach((item, index) => {
      validate[item.type](item).forEach((error) => {
        errors.push(`Sub-question ${index + 1}: ${error}`);
      });
    });

    return errors;
  },
};

const INIT = {
  view: "list",
  questions: [],
  filters: { type: "", difficulty: "", subject: "", search: "" },
  activeType: TYPES.MCQ,
  form: blank.mcq(),
  editingId: null,
  errors: [],
  toast: null,
  stats: { total: 0, byType: {}, byDifficulty: {}, bySubject: {} },
  loading: false,
  saving: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "VIEW":
      return { ...state, view: action.value, errors: [] };
    case "QTYPE":
      return {
        ...state,
        activeType: action.value,
        form: blank[action.value](),
        errors: [],
      };
    case "FORM":
      return { ...state, form: { ...state.form, ...action.value } };
    case "ERRORS":
      return { ...state, errors: action.value };
    case "TOAST":
      return { ...state, toast: action.value };
    case "FILTER":
      return {
        ...state,
        filters: { ...state.filters, [action.key]: action.value },
      };
    case "QUESTIONS":
      return { ...state, questions: action.value, loading: false };
    case "STATS":
      return { ...state, stats: action.value };
    case "LOADING":
      return { ...state, loading: action.value };
    case "SAVING":
      return { ...state, saving: action.value };
    case "EDIT_START":
      return {
        ...state,
        view: "create",
        editingId: action.id,
        activeType: action.questionType,
        form: action.form,
        errors: [],
      };
    case "EDIT_CLEAR":
      return {
        ...state,
        editingId: null,
        form: blank[state.activeType](),
        errors: [],
      };
    default:
      return state;
  }
}

const api = {
  async request(method, path = "", body = null) {
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    if (body !== null) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${path}`, options);
    const json = await response.json();

    if (!response.ok || !json.success) {
      const message =
        typeof json.data === "object" && json.data !== null
          ? Object.values(json.data).join(", ")
          : json.message || "Request failed";
      throw new Error(message);
    }

    return json.data;
  },
  getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.subject) params.set("subject", filters.subject);
    if (filters.search) params.set("search", filters.search);
    const query = params.toString();
    return this.request("GET", query ? `?${query}` : "");
  },
  getStats() {
    return this.request("GET", "/stats");
  },
  create(body) {
    return this.request("POST", "", body);
  },
  update(id, body) {
    return this.request("PUT", `/${id}`, body);
  },
  remove(id) {
    return this.request("DELETE", `/${id}`);
  },
};

function Toast({ msg, kind, onClose }) {
  const background =
    kind === "error" ? "#ff3b5c" : kind === "warn" ? "#f59e0b" : "#00e5a0";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 9999,
        background,
        color: kind === "error" ? "#fff" : "#0a0e1a",
        padding: "14px 22px",
        borderRadius: 12,
        fontWeight: 700,
        fontSize: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,.4)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span>{msg}</span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          opacity: 0.7,
          fontSize: 16,
        }}
      >
        x
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid #1e2540",
          borderTopColor: "#7c6aff",
          animation: "spin .8s linear infinite",
        }}
      />
      <span style={{ color: "var(--text-muted)", fontSize: 14 }}>
        Fetching from Spring Boot...
      </span>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div
      style={{
        background: "var(--surface-bg)",
        border: `1px solid ${accent}33`,
        borderRadius: 16,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span
        style={{
          color: accent,
          fontSize: 28,
          fontWeight: 800,
          fontFamily: "'Space Mono', monospace",
        }}
      >
        {value}
      </span>
      <span
        style={{
          color: "var(--text-secondary)",
          fontSize: 13,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Btn({
  children,
  onClick,
  variant = "primary",
  small,
  ghost,
  danger,
  disabled,
  type = "button",
}) {
  const base = {
    border: "none",
    borderRadius: small ? 8 : 12,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700,
    fontSize: small ? 13 : 15,
    padding: small ? "6px 12px" : "12px 24px",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    opacity: disabled ? 0.5 : 1,
    transition: "all .15s",
  };

  if (ghost) {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        style={{
          ...base,
          background: "var(--pill-bg)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border-color)",
        }}
      >
        {children}
      </button>
    );
  }

  if (danger) {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        style={{
          ...base,
          background: "#ff3b5c22",
          color: "#ff3b5c",
          border: "1px solid #ff3b5c33",
        }}
      >
        {children}
      </button>
    );
  }

  if (variant === "secondary") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        style={{
          ...base,
          background: "var(--pill-bg)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-color)",
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...base,
        background: "linear-gradient(135deg,#7c6aff,#5b4fff)",
        color: "#fff",
      }}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  as,
  rows,
  children,
  disabled,
  rich = as === "textarea" || type === "text",
}) {
  const editorContext = useContext(EditorContext);
  const style = {
    width: "100%",
    background: "var(--input-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: 10,
    padding: "11px 14px",
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    resize: as === "textarea" ? "vertical" : undefined,
    boxSizing: "border-box",
    opacity: disabled ? 0.65 : 1,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600 }}>
          {label}
        </label>
      )}
      {as === "select" ? (
        <select value={value} onChange={onChange} style={style} disabled={disabled}>
          {children}
        </select>
      ) : rich ? (
        <button
          type="button"
          onClick={() =>
            !disabled &&
            editorContext?.openEditor({
              label: label || placeholder || "Editor",
              value: value || "",
              placeholder,
              compact: as !== "textarea",
              onChange: (nextValue) =>
                onChange?.({ target: { value: nextValue } }),
            })
          }
          disabled={disabled}
          style={{
            width: "100%",
            border: "1px solid var(--border-color)",
            borderRadius: 10,
            background: "var(--input-bg)",
            opacity: disabled ? 0.65 : 1,
            minHeight: as === "textarea" ? 116 : 68,
            padding: "12px 14px",
            color: "var(--text-primary)",
            textAlign: "left",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {stripHtml(value || "") ? (
            <div
              style={{ color: "var(--text-primary)", lineHeight: 1.5 }}
              dangerouslySetInnerHTML={{ __html: value || "" }}
            />
          ) : (
            <div style={{ color: "var(--text-muted)" }}>
              {placeholder || "Click to edit in CKEditor"}
            </div>
          )}
          <div style={{ marginTop: 10, color: "#7c6aff", fontSize: 12, fontWeight: 700 }}>
            Click to edit in shared CKEditor
          </div>
        </button>
      ) : as === "textarea" ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows || 3}
          style={style}
          disabled={disabled}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={style}
          disabled={disabled}
        />
      )}
    </div>
  );
}

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

function AnswerConfiguration({ type, form, onPatch }) {
  if (type === TYPES.MCQ) return <MCQForm form={form} onPatch={onPatch} />;
  if (type === TYPES.TRUE_FALSE) return <TrueFalseForm form={form} onPatch={onPatch} />;
  if (type === TYPES.MULTI_CORRECT) return <MultiCorrectForm form={form} onPatch={onPatch} />;
  if (type === TYPES.ARRANGE_SEQUENCE) return <ArrangeSequenceForm form={form} onPatch={onPatch} />;
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

function ComprehensiveForm({ form, onPatch }) {
  const subQuestions = form.subQuestions || [];

  const updateSubQuestion = (index, value) => {
    onPatch({
      subQuestions: subQuestions.map((item, itemIndex) =>
        itemIndex === index ? value : item
      ),
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

function HtmlContent({ html, style }) {
  return <div style={style} dangerouslySetInnerHTML={{ __html: html || "" }} />;
}

function renderQuestionBody(question) {
  if (question.type === TYPES.MCQ) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {(question.options || []).map((option, index) => (
          <span
            key={index}
            style={{
              padding: "3px 12px",
              borderRadius: 8,
              fontSize: 13,
              background: index === question.correctAnswer ? "#00e5a022" : "var(--pill-bg)",
              color: index === question.correctAnswer ? "#00e5a0" : "var(--text-secondary)",
              border:
                index === question.correctAnswer
                  ? "1px solid #00e5a033"
                  : "1px solid transparent",
            }}
          >
            <span style={{ fontWeight: 700, marginRight: 6 }}>
              {String.fromCharCode(65 + index)}.
            </span>
            <span dangerouslySetInnerHTML={{ __html: option || "" }} />
          </span>
        ))}
      </div>
    );
  }

  if (question.type === TYPES.TRUE_FALSE) {
    return (
      <span style={{ color: "#00e5a0", fontSize: 13, fontWeight: 700 }}>
        Answer:{" "}
        {question.correctAnswer === true
          ? "True"
          : question.correctAnswer === false
            ? "False"
            : "-"}
      </span>
    );
  }

  if (question.type === TYPES.MULTI_CORRECT) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {(question.options || []).map((option, index) => (
          <span
            key={index}
            style={{
              padding: "3px 12px",
              borderRadius: 8,
              fontSize: 13,
              background: (question.correctAnswers || []).includes(index)
                ? "#ff9f4322"
                : "var(--pill-bg)",
              color: (question.correctAnswers || []).includes(index)
                ? "#ff9f43"
                : "var(--text-secondary)",
              border: (question.correctAnswers || []).includes(index)
                ? "1px solid #ff9f4333"
                : "1px solid transparent",
            }}
          >
            <span style={{ fontWeight: 700, marginRight: 6 }}>
              {String.fromCharCode(65 + index)}.
            </span>
            <span dangerouslySetInnerHTML={{ __html: option || "" }} />
          </span>
        ))}
      </div>
    );
  }

  if (question.type === TYPES.MATCH_PAIR) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {(question.pairs || []).map((pair, index) => (
          <div key={index} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            <span style={{ color: "#ff6b9d", background: "#ff6b9d22", padding: "2px 10px", borderRadius: 6 }}>
              <span dangerouslySetInnerHTML={{ __html: pair.left || "" }} />
            </span>
            <span style={{ color: "var(--text-secondary)" }}>=</span>
            <span style={{ color: "#7c6aff", background: "#7c6aff22", padding: "2px 10px", borderRadius: 6 }}>
              <span dangerouslySetInnerHTML={{ __html: pair.right || "" }} />
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (question.type === TYPES.ARRANGE_SEQUENCE) {
    const sequence = Array.isArray(question.correctAnswer) ? question.correctAnswer : question.options || [];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sequence.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              padding: "10px 12px",
              borderRadius: 10,
              background: "#ffd16612",
              border: "1px solid #ffd16633",
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                background: "#ffd16622",
                color: "#ffd166",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                flexShrink: 0,
                fontSize: 12,
              }}
            >
              {index + 1}
            </span>
            <span style={{ color: "var(--text-primary)", flex: 1 }} dangerouslySetInnerHTML={{ __html: item || "" }} />
          </div>
        ))}
      </div>
    );
  }

  if (question.type === TYPES.COMPREHENSIVE) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 12,
            background: "var(--surface-alt-bg)",
            border: "1px solid var(--border-color)",
            color: "var(--text-primary)",
            lineHeight: 1.7,
          }}
        >
          <HtmlContent html={question.question} />
        </div>
        {(question.subQuestions || []).map((item, index) => (
          <div
            key={index}
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid var(--border-color)",
              background: "var(--surface-alt-bg)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
              <span style={{ color: TYPE_COLOR[item.type], fontSize: 12, fontWeight: 700 }}>
                {TYPE_LABEL[item.type]}
              </span>
              <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{item.points} pt</span>
            </div>
            <div style={{ color: "var(--text-primary)", marginBottom: 10, display: "flex", gap: 6 }}>
              <span>{index + 1}.</span>
              <HtmlContent html={item.question} style={{ flex: 1 }} />
            </div>
            {renderQuestionBody(item)}
          </div>
        ))}
      </div>
    );
  }

  return null;
}

function Card({ question, onEdit, onDelete, onPreview }) {
  const color = TYPE_COLOR[question.type];

  return (
    <div
      style={{
        background: "var(--surface-bg)",
        borderRadius: 16,
        border: "1px solid var(--border-color)",
        padding: "20px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: color }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ background: `${color}22`, color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            {TYPE_ICON[question.type]} {TYPE_LABEL[question.type]}
          </span>
          <span style={pillStyle}>{question.difficulty}</span>
          <span style={pillStyle}>{question.subject}</span>
          <span style={pillStyle}>{question.points}pt</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Btn small ghost onClick={() => onPreview(question)}>
            View
          </Btn>
          <Btn small ghost onClick={() => onEdit(question)}>
            Edit
          </Btn>
          <Btn small danger onClick={() => onDelete(question.id)}>
            Delete
          </Btn>
        </div>
      </div>

      {question.type !== TYPES.COMPREHENSIVE && (
        <HtmlContent
          html={question.question}
          style={{ color: "var(--text-primary)", fontSize: 15, lineHeight: 1.6, margin: "0 0 10px" }}
        />
      )}

      {renderQuestionBody(question)}

      <div style={{ marginTop: 10, color: "var(--text-muted)", fontSize: 12 }}>
        #{question.id} {question.createdAt ? `- ${new Date(question.createdAt).toLocaleDateString()}` : ""}
      </div>
    </div>
  );
}

function Preview({ question, onClose }) {
  const color = TYPE_COLOR[question.type];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000000cc",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        style={{
        background: "var(--surface-bg)",
          borderRadius: 20,
          padding: 32,
          maxWidth: 760,
          width: "100%",
          border: `1px solid ${color}44`,
          boxShadow: `0 0 60px ${color}22`,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ color, fontWeight: 800, fontSize: 18 }}>
            {TYPE_ICON[question.type]} {TYPE_LABEL[question.type]}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "var(--pill-bg)",
              border: "none",
              color: "var(--text-secondary)",
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Close
          </button>
        </div>

        {question.type !== TYPES.COMPREHENSIVE && (
          <HtmlContent
            html={question.question}
            style={{ color: "var(--text-primary)", fontSize: 17, lineHeight: 1.7, marginBottom: 20 }}
          />
        )}

        {renderQuestionBody(question)}

        {question.explanation && (
          <div
            style={{
              marginTop: 20,
              padding: "14px 18px",
              background: "var(--surface-alt-bg)",
              borderRadius: 12,
              borderLeft: "3px solid var(--text-secondary)",
            }}
          >
            <span style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 700 }}>
              EXPLANATION{" "}
            </span>
            <HtmlContent
              html={question.explanation}
              style={{ color: "var(--text-soft)", fontSize: 14, marginTop: 6 }}
            />
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[question.difficulty, question.subject, `${question.points} point${question.points !== 1 ? "s" : ""}`].map((item) => (
            <span key={item} style={pillStyle}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SharedEditor({ activeEditor, onClose }) {
  if (!activeEditor) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        width: "min(560px, calc(100vw - 48px))",
        maxHeight: "70vh",
        zIndex: 1200,
        background: "var(--surface-strong-bg)",
        border: "1px solid var(--border-strong)",
        borderRadius: 18,
        boxShadow: "0 24px 80px rgba(0,0,0,.45)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 16px",
          borderBottom: "1px solid var(--border-color)",
          background: "linear-gradient(180deg,var(--surface-bg),var(--surface-alt-bg))",
        }}
      >
        <div>
          <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>{activeEditor.label}</div>
          <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>Shared CKEditor panel</div>
        </div>
        <Btn small ghost onClick={onClose}>
          Close
        </Btn>
      </div>
      <div style={{ padding: 12 }}>
        <CKEditor
          key={activeEditor.sessionKey}
          editor={ClassicEditor}
          config={getEditorConfig(activeEditor.placeholder, activeEditor.compact)}
          data={activeEditor.value || ""}
          onReady={(editor) => {
            editor.model.change((writer) => {
              writer.setSelection(
                writer.createPositionAt(editor.model.document.getRoot(), "end")
              );
            });
            editor.editing.view.focus();
          }}
          onChange={(_, editor) => activeEditor.onChange(editor.getData())}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, INIT);
  const [preview, setPreview] = useState(null);
  const [activeEditor, setActiveEditor] = useState(null);
  const [themeMode, setThemeMode] = useState("dark");
  const [fontScale, setFontScale] = useState(1);
  const [meta, setMeta] = useState({
    difficulty: "Medium",
    subject: "General Knowledge",
    tags: "",
  });

  const showToast = useCallback((message, kind = "success") => {
    dispatch({ type: "TOAST", value: { msg: message, kind } });
    setTimeout(() => dispatch({ type: "TOAST", value: null }), 3500);
  }, []);

  const openEditor = useCallback((config) => {
    setActiveEditor({
      ...config,
      sessionKey: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });
  }, []);

  const closeEditor = useCallback(() => {
    setActiveEditor(null);
  }, []);

  const refresh = useCallback(
    async (filters) => {
      dispatch({ type: "LOADING", value: true });
      try {
        const nextFilters = filters ?? state.filters;
        const [questions, stats] = await Promise.all([
          api.getAll(nextFilters),
          api.getStats(),
        ]);
        dispatch({ type: "QUESTIONS", value: questions.map(normalise) });
        dispatch({ type: "STATS", value: stats });
      } catch {
        showToast("Cannot reach Spring Boot API at 8082. Check whether it is running.", "error");
        dispatch({ type: "LOADING", value: false });
      }
    },
    [state.filters, showToast]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    closeEditor();
  }, [closeEditor, state.view, state.activeType, state.editingId]);
useEffect(() => {
  const saved = localStorage.getItem("fontScale");
  if (saved) setFontScale(Number(saved));
}, []);

useEffect(() => {
  localStorage.setItem("fontScale", fontScale);
}, [fontScale]);
  const handleFilter = useCallback(
    (key, value) => {
      const nextFilters = { ...state.filters, [key]: value };
      dispatch({ type: "FILTER", key, value });
      refresh(nextFilters);
    },
    [refresh, state.filters]
  );

  const handleSave = useCallback(async () => {
    const errors = validate[state.activeType](state.form);
    if (errors.length) {
      dispatch({ type: "ERRORS", value: errors });
      return;
    }

    dispatch({ type: "SAVING", value: true });
    try {
      const payload = buildPayload(state.activeType, state.form, meta);
      if (state.editingId) {
        await api.update(state.editingId, payload);
        showToast(`Updated question ${state.editingId}`);
      } else {
        await api.create(payload);
        showToast("Created question");
      }
      dispatch({ type: "ERRORS", value: [] });
      dispatch({ type: "EDIT_CLEAR" });
      dispatch({ type: "VIEW", value: "list" });
      await refresh();
    } catch (error) {
      showToast(error.message || "Save failed", "error");
    } finally {
      dispatch({ type: "SAVING", value: false });
    }
  }, [meta, refresh, showToast, state.activeType, state.editingId, state.form]);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await api.remove(id);
        showToast(`Deleted question ${id}`, "warn");
        await refresh();
      } catch (error) {
        showToast(error.message || "Delete failed", "error");
      }
    },
    [refresh, showToast]
  );

  const handleEdit = useCallback((question) => {
    const pad = (values, size) => [
      ...(values || []),
      ...Array(Math.max(0, size - (values || []).length)).fill(""),
    ];

    const form = {
      question: question.question,
      explanation: question.explanation || "",
      points: question.points || 1,
      ...(question.type === TYPES.MCQ
        ? { options: pad(question.options, 4), correctAnswer: question.correctAnswer }
        : {}),
      ...(question.type === TYPES.TRUE_FALSE
        ? { correctAnswer: question.correctAnswer }
        : {}),
      ...(question.type === TYPES.MULTI_CORRECT
        ? {
            options: pad(question.options, 4),
            correctAnswers: question.correctAnswers || [],
          }
        : {}),
      ...(question.type === TYPES.ARRANGE_SEQUENCE
        ? {
            options: pad(
              Array.isArray(question.correctAnswer) ? question.correctAnswer : question.options,
              4
            ),
          }
        : {}),
      ...(question.type === TYPES.MATCH_PAIR
        ? {
            pairs: [
              ...(question.pairs || []),
              ...Array(Math.max(0, 3 - (question.pairs || []).length)).fill({
                left: "",
                right: "",
              }),
            ],
          }
        : {}),
      ...(question.type === TYPES.COMPREHENSIVE
        ? {
            subQuestions: (question.subQuestions || []).map(normaliseSubQuestion),
          }
        : {}),
    };

    setMeta({
      difficulty: question.difficulty,
      subject: question.subject,
      tags: question.tags || "",
    });

    dispatch({
      type: "EDIT_START",
      id: question.id,
      questionType: question.type,
      form,
    });
  }, []);

  const renderMainForm = () => {
    if (state.activeType === TYPES.COMPREHENSIVE) {
      return (
        <ComprehensiveForm
          form={state.form}
          onPatch={(value) => dispatch({ type: "FORM", value })}
        />
      );
    }

    return (
      <div style={{ background: "var(--surface-bg)", borderRadius: 16, padding: "20px 24px", border: "1px solid var(--border-color)" }}>
        <div
          style={{
            color: "var(--text-secondary)",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 16,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Answer Configuration
        </div>
        <AnswerConfiguration
          type={state.activeType}
          form={state.form}
          onPatch={(value) => dispatch({ type: "FORM", value })}
        />
      </div>
    );
  };

  return (
    <EditorContext.Provider value={{ openEditor }}>
      <div
        style={{
          ...THEME_VARS[themeMode],
          minHeight: "100vh",
          background: "var(--app-bg)",
          fontFamily: "'Sora', 'Segoe UI', sans-serif",
          color: "var(--text-primary)",
          zoom: fontScale,
        }}
      >
      <div
        style={{
          background: "var(--nav-bg)",
          borderBottom: "1px solid var(--border-color)",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ background: "linear-gradient(135deg,#7c6aff,#5b4fff)", borderRadius: 12, padding: "8px 12px", fontSize: 20 }}>
            QB
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Question Bank</div>
            <div style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "'Space Mono', monospace" }}>
              SPRING BOOT REST - 8082 - {state.stats.total} QUESTIONS
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Btn
            ghost
            onClick={() => setFontScale((current) => Math.max(0.85, +(current - 0.05).toFixed(2)))}
          >
            A-
          </Btn>
          <Btn
            ghost
            onClick={() => setFontScale((current) => Math.min(1.3, +(current + 0.05).toFixed(2)))}
          >
            A+
          </Btn>
          <Btn
            ghost
            onClick={() => setThemeMode((current) => (current === "dark" ? "light" : "dark"))}
          >
            {themeMode === "dark" ? "Light Mode" : "Dark Mode"}
          </Btn>
          {state.view !== "list" ? (
            <Btn
              variant="secondary"
              onClick={() => {
                dispatch({ type: "VIEW", value: "list" });
                dispatch({ type: "EDIT_CLEAR" });
              }}
            >
              Back
            </Btn>
          ) : (
            <Btn onClick={() => dispatch({ type: "VIEW", value: "create" })}>
              + New Question
            </Btn>
          )}
        </div>
      </div>

      <div style={{ width: "90%", maxWidth: "none", margin: "0 auto", padding: "32px 24px" }}>
        {state.view === "list" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 16, marginBottom: 32 }}>
              <StatCard label="Total" value={state.stats.total} accent="#7c6aff" />
              <StatCard label="MCQ" value={state.stats.byType?.mcq || 0} accent="#7c6aff" />
              <StatCard label="True/False" value={state.stats.byType?.true_false || 0} accent="#00e5a0" />
              <StatCard label="Multi-Correct" value={state.stats.byType?.multi_correct || 0} accent="#ff9f43" />
              <StatCard label="Match Pair" value={state.stats.byType?.match_pair || 0} accent="#ff6b9d" />
              <StatCard label="Sequence" value={state.stats.byType?.arrange_sequence || 0} accent="#ffd166" />
              <StatCard label="Comprehensive" value={state.stats.byType?.comprehensive || 0} accent="#4cc9f0" />
            </div>

            <div
              style={{
                background: "var(--surface-bg)",
                borderRadius: 16,
                border: "1px solid var(--border-color)",
                padding: "20px 24px",
                marginBottom: 24,
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div style={{ flex: 2, minWidth: 200 }}>
                <input
                  value={state.filters.search}
                  onChange={(event) => handleFilter("search", event.target.value)}
                  placeholder="Search questions..."
                  style={{ ...inputStyle, width: "100%" }}
                />
              </div>
              {[
                { key: "type", options: [["", "All Types"], ...Object.entries(TYPE_LABEL)] },
                { key: "difficulty", options: [["", "All Levels"], ...DIFFS.map((item) => [item, item])] },
                { key: "subject", options: [["", "All Subjects"], ...SUBJECTS.map((item) => [item, item])] },
              ].map(({ key, options }) => (
                <select
                  key={key}
                  value={state.filters[key]}
                  onChange={(event) => handleFilter(key, event.target.value)}
                  style={{
                    background: "var(--input-bg)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    color: "var(--text-secondary)",
                    fontSize: 14,
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  {options.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              ))}
            </div>

            {state.loading ? (
              <Spinner />
            ) : state.questions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 20px" }}>
                <div style={{ color: "var(--text-muted)", fontSize: 18, fontWeight: 700 }}>No questions found</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 8 }}>
                  Click "New Question" to get started
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  {state.questions.length} question{state.questions.length !== 1 ? "s" : ""} found
                </div>
                {state.questions.map((question) => (
                  <Card
                    key={question.id}
                    question={question}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onPreview={setPreview}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {state.view === "create" && (
          <div style={{ width: "90%", maxWidth: "none", margin: "0 auto" }}>
            <h2 style={{ margin: "0 0 24px", fontWeight: 800, fontSize: 26 }}>
              {state.editingId ? "Edit Question" : "Create Question"}
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 28 }}>
              {Object.values(TYPES).map((type) => {
                const color = TYPE_COLOR[type];
                const active = state.activeType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => !state.editingId && dispatch({ type: "QTYPE", value: type })}
                    disabled={!!state.editingId}
                    style={{
                      padding: "14px 10px",
                      borderRadius: 14,
                      cursor: state.editingId ? "not-allowed" : "pointer",
                      textAlign: "center",
                      border: `2px solid ${active ? color : "var(--border-color)"}`,
                      background: active ? `${color}22` : "var(--surface-bg)",
                      color: active ? color : "var(--text-secondary)",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{TYPE_ICON[type]}</div>
                    {TYPE_LABEL[type]}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Field
                label={state.activeType === TYPES.COMPREHENSIVE ? "Statement / Passage *" : "Question Text *"}
                as="textarea"
                rows={state.activeType === TYPES.COMPREHENSIVE ? 6 : 3}
                value={state.form.question}
                onChange={(event) => dispatch({ type: "FORM", value: { question: event.target.value } })}
                placeholder={
                  state.activeType === TYPES.COMPREHENSIVE
                    ? "Enter the common statement or passage here..."
                    : "Enter your question here..."
                }
              />

              {renderMainForm()}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <Field
                  label="Difficulty"
                  as="select"
                  value={meta.difficulty}
                  onChange={(event) => setMeta((current) => ({ ...current, difficulty: event.target.value }))}
                >
                  {DIFFS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Field>
                <Field
                  label="Subject"
                  as="select"
                  value={meta.subject}
                  onChange={(event) => setMeta((current) => ({ ...current, subject: event.target.value }))}
                >
                  {SUBJECTS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Field>
                <Field
                  label="Points"
                  type="number"
                  value={state.activeType === TYPES.COMPREHENSIVE ? sumSubQuestionPoints(state.form.subQuestions) : state.form.points}
                  onChange={(event) =>
                    dispatch({
                      type: "FORM",
                      value: { points: Math.max(1, parseInt(event.target.value, 10) || 1) },
                    })
                  }
                  disabled={state.activeType === TYPES.COMPREHENSIVE}
                />
              </div>

              <Field
                label="Explanation (optional)"
                as="textarea"
                rows={2}
                value={state.form.explanation}
                onChange={(event) => dispatch({ type: "FORM", value: { explanation: event.target.value } })}
                placeholder={
                  state.activeType === TYPES.COMPREHENSIVE
                    ? "Optional explanation for the full passage..."
                    : "Explain the correct answer..."
                }
              />

              {state.errors.length > 0 && (
                <div style={{ background: "#ff3b5c22", border: "1px solid #ff3b5c44", borderRadius: 12, padding: "14px 18px" }}>
                  {state.errors.map((error, index) => (
                    <div key={index} style={{ color: "#ff3b5c", fontSize: 14, fontWeight: 600 }}>
                      {error}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <Btn
                  variant="secondary"
                  onClick={() => {
                    dispatch({ type: "VIEW", value: "list" });
                    dispatch({ type: "EDIT_CLEAR" });
                  }}
                >
                  Cancel
                </Btn>
                <Btn onClick={handleSave} disabled={state.saving}>
                  {state.saving ? "Saving..." : state.editingId ? `Update ${state.editingId}` : "Save Question"}
                </Btn>
              </div>
            </div>
          </div>
        )}
      </div>

      {preview && <Preview question={preview} onClose={() => setPreview(null)} />}
      {state.toast && (
        <Toast
          msg={state.toast.msg}
          kind={state.toast.kind}
          onClose={() => dispatch({ type: "TOAST", value: null })}
        />
      )}
      <SharedEditor activeEditor={activeEditor} onClose={closeEditor} />
    </div>
    </EditorContext.Provider>
  );
}
