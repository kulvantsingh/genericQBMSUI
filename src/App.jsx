import { useCallback, useEffect, useReducer, useState } from "react";
import "./styles/app-layout.css";
import cdacLogo from "./assets/cdac.png";

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
  ThemeToggle,
  Toast,
} from "./features/questionBank/components";

const THEME_STORAGE_KEY = "themeMode";

function getInitialThemeMode() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  } catch {
    // Ignore localStorage access issues and fall back to default.
  }

  return "light";
}

function NavIcon({ name }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (name === "menu") {
    return (
      <svg {...common}>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === "refresh") {
    return (
      <svg {...common}>
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
      </svg>
    );
  }

  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M3 10.5L12 4l9 6.5" />
        <path d="M5 9.5V20h14V9.5" />
      </svg>
    );
  }

  if (name === "question") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.8 9.2a2.4 2.4 0 0 1 4.4 1.2c0 1.8-2.2 2.2-2.2 3.8" />
        <circle cx="12" cy="16.8" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (name === "exam") {
    return (
      <svg {...common}>
        <path d="M7 3.5h10a2 2 0 0 1 2 2V20l-4-2-3 2-3-2-4 2V5.5a2 2 0 0 1 2-2z" />
        <path d="M9 8h6M9 12h6" />
      </svg>
    );
  }

  if (name === "chevronDown") {
    return (
      <svg {...common}>
        <path d="m6 9 6 6 6-6" />
      </svg>
    );
  }

  if (name === "chevronUp") {
    return (
      <svg {...common}>
        <path d="m18 15-6-6-6 6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1.5" />
      <circle cx="4" cy="12" r="1.5" />
      <circle cx="4" cy="18" r="1.5" />
    </svg>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, INIT);
  const [preview, setPreview] = useState(null);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarSections, setSidebarSections] = useState({
    question: true,
    exam: false,
  });
  const [themeMode, setThemeMode] = useState(getInitialThemeMode);
  const [fontScale, setFontScale] = useState(1);
  const [meta, setMeta] = useState(DEFAULT_META);
  const statAccents =
    themeMode === "light"
      ? {
          total: "#40404c",
          mcq: "#577cb7",
          true_false: "#b16c96",
          multi_correct: "#9a3e76",
          match_pair: "#d4a0bc",
          arrange_sequence: "#cca4cc",
          comprehensive: "#40404c",
        }
      : {
          total: "#7c6aff",
          mcq: "#7c6aff",
          true_false: "#00e5a0",
          multi_correct: "#ff9f43",
          match_pair: "#ff6b9d",
          arrange_sequence: "#ffd166",
          comprehensive: "#4cc9f0",
        };

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

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  const handleFilter = useCallback(
    (key, value) => {
      const nextFilters = { ...state.filters, [key]: value };
      dispatch({ type: "FILTER", key, value });
      refresh(nextFilters);
    },
    [refresh, state.filters]
  );

  const handleTypeCardFilter = useCallback(
    (type) => {
      const nextType = state.filters.type === type ? "" : type;
      handleFilter("type", nextType);
    },
    [handleFilter, state.filters.type]
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
        showToast("Question updated");
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

  const goListView = useCallback(() => {
    dispatch({ type: "VIEW", value: "list" });
    dispatch({ type: "EDIT_CLEAR" });
  }, []);

  const goCreateView = useCallback(() => {
    dispatch({ type: "VIEW", value: "create" });
  }, []);

  const toggleSidebarSection = useCallback((section) => {
    setSidebarSections((current) => ({ ...current, [section]: !current[section] }));
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
          minHeight: `${100 / fontScale}vh`,
          background: "var(--app-bg)",
          fontFamily: "'Segoe UI', sans-serif",
          color: "var(--text-primary)",
          zoom: fontScale,
        }}
      >
        <div
          className="app-top-nav"
          style={{
            marginLeft: isSidebarCollapsed ? 76 : 246,
            transition: "margin-left .2s ease",
          }}
        >
          <div className="app-top-nav-left">
            <div className="app-top-nav-logo-wrap">
              <img src={cdacLogo} alt="CDAC logo" className="app-top-nav-logo" />
            </div>
            <div>
              <div className="app-top-nav-title">Question Bank</div>
              <div className="app-top-nav-subtitle">
                {state.stats.total} QUESTIONS
              </div>
            </div>
          </div>
          <div className="app-top-nav-actions">
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
            <ThemeToggle
              isDark={themeMode === "dark"}
              onToggle={() =>
                setThemeMode((current) => (current === "dark" ? "light" : "dark"))
              }
            />
            {state.view !== "list" ? (
              <Btn variant="secondary" onClick={goListView}>
                Back
              </Btn>
            ) : (
              <Btn onClick={goCreateView}>
                + New Question
              </Btn>
            )}
          </div>
        </div>

        <aside
          className="app-sidebar"
          style={{
            width: isSidebarCollapsed ? 76 : 246,
            transition: "width .2s ease",
          }}
        >
          <div
            className="app-sidebar-header"
            style={{
              justifyContent: isSidebarCollapsed ? "center" : "space-between",
              padding: isSidebarCollapsed ? "0 10px" : "0 16px",
            }}
          >
            {!isSidebarCollapsed && (
              <div>
                <div className="app-sidebar-brand-title">Question</div>
                <div className="app-sidebar-brand-subtitle">Bank</div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              className="app-sidebar-collapse-btn"
            >
              <NavIcon name="menu" />
            </button>
          </div>

          <div className="app-sidebar-content">
            <button
              type="button"
              onClick={goListView}
              className="sidebar-row-btn sidebar-row-muted"
              style={{
                padding: isSidebarCollapsed ? "10px 8px" : "10px 6px",
                justifyContent: isSidebarCollapsed ? "center" : "flex-start",
              }}
            >
              <span className="sidebar-row-chevron">
                <NavIcon name="home" />
              </span>
              {!isSidebarCollapsed && <span>Dashboard</span>}
            </button>

            <button
              type="button"
              onClick={() => !isSidebarCollapsed && toggleSidebarSection("question")}
              className="sidebar-row-btn sidebar-row-primary"
              style={{
                padding: isSidebarCollapsed ? "10px 8px" : "10px 6px",
                justifyContent: isSidebarCollapsed ? "center" : "space-between",
              }}
            >
              <span className="sidebar-row-main">
                <span className="sidebar-row-chevron">
                  <NavIcon name="question" />
                </span>
                {!isSidebarCollapsed && <span>Question</span>}
              </span>
              {!isSidebarCollapsed && (
                <span className="sidebar-row-chevron">
                  <NavIcon name={sidebarSections.question ? "chevronUp" : "chevronDown"} />
                </span>
              )}
            </button>

            {!isSidebarCollapsed && sidebarSections.question && (
              <div className="sidebar-submenu">
                {[
                  {
                    key: "create-question",
                    label: "Create New Question",
                    active: state.view === "create",
                    action: goCreateView,
                  },
                  {
                    key: "all-question",
                    label: "All Question",
                    active: state.view === "list",
                    action: goListView,
                  },
                  {
                    key: "question-category",
                    label: "Question Category",
                    active: false,
                    action: () => showToast("Question Category view coming soon", "warn"),
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={item.action}
                    className={`sidebar-submenu-btn ${item.active ? "active" : ""}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => !isSidebarCollapsed && toggleSidebarSection("exam")}
              className="sidebar-row-btn sidebar-row-muted"
              style={{
                marginTop: 10,
                padding: isSidebarCollapsed ? "10px 8px" : "10px 6px",
                justifyContent: isSidebarCollapsed ? "center" : "space-between",
              }}
            >
              <span className="sidebar-row-main">
                <span className="sidebar-row-chevron">
                  <NavIcon name="exam" />
                </span>
                {!isSidebarCollapsed && <span>Exam</span>}
              </span>
              {!isSidebarCollapsed && (
                <span className="sidebar-row-chevron">
                  <NavIcon name={sidebarSections.exam ? "chevronUp" : "chevronDown"} />
                </span>
              )}
            </button>

            {!isSidebarCollapsed && sidebarSections.exam && (
              <div className="sidebar-submenu">
                <button
                  type="button"
                  onClick={() => showToast("Exam module coming soon", "warn")}
                  className="sidebar-submenu-btn"
                >
                  Exam Dashboard
                </button>
              </div>
            )}
          </div>
        </aside>

        <div
          className="app-main-content"
          style={{
            marginLeft: isSidebarCollapsed ? 76 : 246,
            transition: "margin-left .2s ease",
          }}
        >
          <div className="app-main-content-inner">
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
                <StatCard
                  label="Total"
                  value={state.stats.total}
                  accent={statAccents.total}
                  active={!state.filters.type}
                  onClick={() => handleFilter("type", "")}
                />
                <StatCard
                  label="MCQ"
                  value={state.stats.byType?.mcq || 0}
                  accent={statAccents.mcq}
                  active={state.filters.type === TYPES.MCQ}
                  onClick={() => handleTypeCardFilter(TYPES.MCQ)}
                />
                <StatCard
                  label="True/False"
                  value={state.stats.byType?.true_false || 0}
                  accent={statAccents.true_false}
                  active={state.filters.type === TYPES.TRUE_FALSE}
                  onClick={() => handleTypeCardFilter(TYPES.TRUE_FALSE)}
                />
                <StatCard
                  label="Multi-Correct"
                  value={state.stats.byType?.multi_correct || 0}
                  accent={statAccents.multi_correct}
                  active={state.filters.type === TYPES.MULTI_CORRECT}
                  onClick={() => handleTypeCardFilter(TYPES.MULTI_CORRECT)}
                />
                <StatCard
                  label="Match Pair"
                  value={state.stats.byType?.match_pair || 0}
                  accent={statAccents.match_pair}
                  active={state.filters.type === TYPES.MATCH_PAIR}
                  onClick={() => handleTypeCardFilter(TYPES.MATCH_PAIR)}
                />
                <StatCard
                  label="Sequence"
                  value={state.stats.byType?.arrange_sequence || 0}
                  accent={statAccents.arrange_sequence}
                  active={state.filters.type === TYPES.ARRANGE_SEQUENCE}
                  onClick={() => handleTypeCardFilter(TYPES.ARRANGE_SEQUENCE)}
                />
                <StatCard
                  label="Comprehensive"
                  value={state.stats.byType?.comprehensive || 0}
                  accent={statAccents.comprehensive}
                  active={state.filters.type === TYPES.COMPREHENSIVE}
                  onClick={() => handleTypeCardFilter(TYPES.COMPREHENSIVE)}
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
                        padding: "18px 10px",
                        minHeight: 96,
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
                      <div style={{ marginBottom: 6, display: "flex", justifyContent: "center" }}>
                        <img
                          src={TYPE_ICON[type]}
                          alt={`${TYPE_LABEL[type]} icon`}
                          style={{
                            width: 50,
                            height: 44,
                            objectFit: "contain",
                            filter: "var(--type-icon-filter, none)",
                          }}
                        />
                      </div>
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
                      : "Question *"
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

                <Field
                  label="Instruction (optional)"
                  as="textarea"
                  rows={2}
                  value={state.form.instruction || ""}
                  onChange={(event) =>
                    dispatch({ type: "FORM", value: { instruction: event.target.value } })
                  }
                  placeholder="Add optional instructions for students..."
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
                      background: "var(--danger-soft-bg)",
                      border: "1px solid var(--danger-border)",
                      borderRadius: 12,
                      padding: "14px 18px",
                    }}
                  >
                    {state.errors.map((error, index) => (
                      <div
                        key={index}
                        style={{ color: "var(--danger)", fontSize: 14, fontWeight: 600 }}
                      >
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
                        ? `Update`
                        : "Save Question"}
                  </Btn>
                </div>
              </div>
            </div>
          )}
          </div>
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
