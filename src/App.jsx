import { useCallback, useEffect, useReducer, useState } from "react";

import {
  DEFAULT_META,
  DIFFS,
  SUBJECTS,
  THEME_VARS,
  TYPES,
  TYPE_COLOR,
  TYPE_ICON,
  TYPE_LABEL,
  inputStyle,
} from "./features/questionBank/constants";
import { EditorContext } from "./features/questionBank/editorContext";
import { api } from "./features/questionBank/api";
import {
  buildPayload,
  normalise,
  sumSubQuestionPoints,
  toEditableForm,
  validate,
} from "./features/questionBank/questionUtils";
import { INIT, reducer } from "./features/questionBank/state";
import {
  AnswerConfiguration,
  Btn,
  Card,
  ComprehensiveForm,
  Field,
  Preview,
  Spinner,
  StatCard,
  Toast,
} from "./features/questionBank/components";

export default function App() {
  const [state, dispatch] = useReducer(reducer, INIT);
  const [preview, setPreview] = useState(null);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [themeMode, setThemeMode] = useState("dark");
  const [fontScale, setFontScale] = useState(1);
  const [meta, setMeta] = useState(DEFAULT_META);

  const showToast = useCallback((message, kind = "success") => {
    dispatch({ type: "TOAST", value: { msg: message, kind } });
    setTimeout(() => dispatch({ type: "TOAST", value: null }), 3500);
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
    [showToast, state.filters]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setActiveFieldId(null);
  }, [state.view, state.activeType, state.editingId]);

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
    setMeta({
      difficulty: question.difficulty,
      subject: question.subject,
      tags: question.tags || "",
    });

    dispatch({
      type: "EDIT_START",
      id: question.id,
      questionType: question.type,
      form: toEditableForm(question),
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
      <div
        style={{
          background: "var(--surface-bg)",
          borderRadius: 16,
          padding: "20px 24px",
          border: "1px solid var(--border-color)",
        }}
      >
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
    <EditorContext.Provider value={{ activeFieldId, setActiveFieldId }}>
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
            <div
              style={{
                background: "linear-gradient(135deg,#7c6aff,#5b4fff)",
                borderRadius: 12,
                padding: "8px 12px",
                fontSize: 20,
              }}
            >
              QB
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Question Bank</div>
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 12,
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                SPRING BOOT REST - 8082 - {state.stats.total} QUESTIONS
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Btn
              ghost
              onClick={() =>
                setFontScale((current) => Math.max(0.85, +(current - 0.05).toFixed(2)))
              }
            >
              A-
            </Btn>
            <Btn
              ghost
              onClick={() =>
                setFontScale((current) => Math.min(1.3, +(current + 0.05).toFixed(2)))
              }
            >
              A+
            </Btn>
            <Btn
              ghost
              onClick={() =>
                setThemeMode((current) => (current === "dark" ? "light" : "dark"))
              }
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

        <div
          style={{
            width: "90%",
            maxWidth: "none",
            margin: "0 auto",
            padding: "32px 24px",
          }}
        >
          {state.view === "list" && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
                  gap: 16,
                  marginBottom: 32,
                }}
              >
                <StatCard label="Total" value={state.stats.total} accent="#7c6aff" />
                <StatCard label="MCQ" value={state.stats.byType?.mcq || 0} accent="#7c6aff" />
                <StatCard
                  label="True/False"
                  value={state.stats.byType?.true_false || 0}
                  accent="#00e5a0"
                />
                <StatCard
                  label="Multi-Correct"
                  value={state.stats.byType?.multi_correct || 0}
                  accent="#ff9f43"
                />
                <StatCard
                  label="Match Pair"
                  value={state.stats.byType?.match_pair || 0}
                  accent="#ff6b9d"
                />
                <StatCard
                  label="Sequence"
                  value={state.stats.byType?.arrange_sequence || 0}
                  accent="#ffd166"
                />
                <StatCard
                  label="Comprehensive"
                  value={state.stats.byType?.comprehensive || 0}
                  accent="#4cc9f0"
                />
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
                  {
                    key: "difficulty",
                    options: [["", "All Levels"], ...DIFFS.map((item) => [item, item])],
                  },
                  {
                    key: "subject",
                    options: [["", "All Subjects"], ...SUBJECTS.map((item) => [item, item])],
                  },
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
                  <div style={{ color: "var(--text-muted)", fontSize: 18, fontWeight: 700 }}>
                    No questions found
                  </div>
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

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
                  gap: 12,
                  marginBottom: 28,
                }}
              >
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
                  label={
                    state.activeType === TYPES.COMPREHENSIVE
                      ? "Statement / Passage *"
                      : "Question Text *"
                  }
                  as="textarea"
                  rows={state.activeType === TYPES.COMPREHENSIVE ? 6 : 3}
                  value={state.form.question}
                  onChange={(event) =>
                    dispatch({ type: "FORM", value: { question: event.target.value } })
                  }
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
                    onChange={(event) =>
                      setMeta((current) => ({ ...current, difficulty: event.target.value }))
                    }
                  >
                    {DIFFS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Field>
                  <Field
                    label="Subject"
                    as="select"
                    value={meta.subject}
                    onChange={(event) =>
                      setMeta((current) => ({ ...current, subject: event.target.value }))
                    }
                  >
                    {SUBJECTS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Field>
                  <Field
                    label="Points"
                    type="number"
                    value={
                      state.activeType === TYPES.COMPREHENSIVE
                        ? sumSubQuestionPoints(state.form.subQuestions)
                        : state.form.points
                    }
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
                  onChange={(event) =>
                    dispatch({ type: "FORM", value: { explanation: event.target.value } })
                  }
                  placeholder={
                    state.activeType === TYPES.COMPREHENSIVE
                      ? "Optional explanation for the full passage..."
                      : "Explain the correct answer..."
                  }
                />

                {state.errors.length > 0 && (
                  <div
                    style={{
                      background: "#ff3b5c22",
                      border: "1px solid #ff3b5c44",
                      borderRadius: 12,
                      padding: "14px 18px",
                    }}
                  >
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
                    {state.saving
                      ? "Saving..."
                      : state.editingId
                        ? `Update ${state.editingId}`
                        : "Save Question"}
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
      </div>
    </EditorContext.Provider>
  );
}
