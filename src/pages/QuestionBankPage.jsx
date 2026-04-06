import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { TopNav } from "../components/layout/TopNav";
import { Sidebar } from "../components/layout/Sidebar";

import {
  DEFAULT_META,
  DIFFS,
  SUBJECTS,
  TYPES,
  TYPE_COLOR,
  TYPE_ICON,
  TYPE_LABEL,
  inputStyle,
} from "../features/questionBank/utils/constants";
import { api } from "../features/questionBank/services/api";
import {
  buildPayload,
  normalise,
  sumSubQuestionPoints,
  toEditableForm,
  validate,
} from "../features/questionBank/utils/questionUtils";
import { INIT, reducer } from "../features/questionBank/store/state";
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
} from "../features/questionBank/components";

export function QuestionBankPage({
  language,
  setLanguage,
  t,
  themeMode,
  setThemeMode,
  fontScale,
  setFontScale,
  setActiveFieldId
}) {
  const [state, dispatch] = useReducer(reducer, INIT);
  const [preview, setPreview] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarSections, setSidebarSections] = useState({
    question: true,
    exam: false,
  });
  const [meta, setMeta] = useState(DEFAULT_META);
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const toastTimerRef = useRef(null);
  const pendingDeleteTimersRef = useRef(new Map());
  const activeDeleteToastIdRef = useRef(null);

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

  const showToast = useCallback((message, kind = "success", options = {}) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }

    dispatch({
      type: "TOAST",
      value: {
        msg: message,
        kind,
        actionLabel: options.actionLabel || null,
        onAction: options.onAction || null,
      },
    });

    const duration = options.duration ?? 3500;
    if (duration > 0) {
      toastTimerRef.current = setTimeout(() => {
        dispatch({ type: "TOAST", value: null });
        toastTimerRef.current = null;
      }, duration);
    }
  }, []);

  const closeToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    activeDeleteToastIdRef.current = null;
    dispatch({ type: "TOAST", value: null });
  }, []);

  const showPendingDeleteToast = useCallback(
    (id, secondsRemaining, onUndo) => {
      activeDeleteToastIdRef.current = id;
      dispatch({
        type: "TOAST",
        value: {
          msg: `${t("Question will be deleted in")} ${secondsRemaining} ${t("seconds")}`,
          kind: "warn",
          actionLabel: t("Undo"),
          onAction: onUndo,
        },
      });
    },
    [t]
  );

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
        showToast(t("Cannot reach Spring Boot API at 8082. Check whether it is running."), "error");
        dispatch({ type: "LOADING", value: false });
      }
    },
    [showToast, state.filters, t]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setActiveFieldId(null);
  }, [state.view, state.activeType, state.editingId, setActiveFieldId]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      pendingDeleteTimersRef.current.forEach(({ timeoutId, intervalId }) => {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
      });
      pendingDeleteTimersRef.current.clear();
    };
  }, []);

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
    const errors = validate[state.activeType](state.form, t);
    if (errors.length) {
      dispatch({ type: "ERRORS", value: errors });
      return;
    }

    dispatch({ type: "SAVING", value: true });
    try {
      const payload = buildPayload(state.activeType, state.form, meta);
      if (state.editingId) {
        await api.update(state.editingId, payload);
        showToast(t("Question updated"));
      } else {
        await api.create(payload);
        showToast(t("Created question"));
      }
      dispatch({ type: "ERRORS", value: [] });
      dispatch({ type: "EDIT_CLEAR" });
      dispatch({ type: "VIEW", value: "list" });
      await refresh();
    } catch (error) {
      showToast(error.message || t("Save failed"), "error");
    } finally {
      dispatch({ type: "SAVING", value: false });
    }
  }, [meta, refresh, showToast, state.activeType, state.editingId, state.form, t]);

  const undoPendingDelete = useCallback(
    (id) => {
      const timer = pendingDeleteTimersRef.current.get(id);
      if (timer) {
        clearTimeout(timer.timeoutId);
        clearInterval(timer.intervalId);
        pendingDeleteTimersRef.current.delete(id);
      }
      setPendingDeleteIds((current) => current.filter((item) => item !== id));
      if (activeDeleteToastIdRef.current === id) {
        activeDeleteToastIdRef.current = null;
      }
      showToast(t("Question deletion canceled"), "success");
    },
    [showToast, t]
  );

  const handleDelete = useCallback(
    (id) => {
      if (pendingDeleteTimersRef.current.has(id)) return;

      setPendingDeleteIds((current) => (current.includes(id) ? current : [...current, id]));

      let secondsRemaining = 10;
      const onUndo = () => undoPendingDelete(id);
      showPendingDeleteToast(id, secondsRemaining, onUndo);

      const intervalId = setInterval(() => {
        secondsRemaining -= 1;
        if (secondsRemaining <= 0) {
          clearInterval(intervalId);
          return;
        }
        if (activeDeleteToastIdRef.current === id) {
          showPendingDeleteToast(id, secondsRemaining, onUndo);
        }
      }, 1000);

      const timeoutId = setTimeout(async () => {
        clearInterval(intervalId);
        pendingDeleteTimersRef.current.delete(id);
        try {
          await api.remove(id);
          setPendingDeleteIds((current) => current.filter((item) => item !== id));
          if (activeDeleteToastIdRef.current === id) {
            activeDeleteToastIdRef.current = null;
            showToast(`${t("Deleted question")} ${id}`, "warn");
          } else {
            showToast(`${t("Deleted question")} ${id}`, "warn");
          }
          await refresh();
        } catch (error) {
          setPendingDeleteIds((current) => current.filter((item) => item !== id));
          if (activeDeleteToastIdRef.current === id) {
            activeDeleteToastIdRef.current = null;
          }
          showToast(error.message || t("Delete failed"), "error");
          await refresh();
        }
      }, 10000);

      pendingDeleteTimersRef.current.set(id, { timeoutId, intervalId });
    },
    [refresh, showPendingDeleteToast, showToast, t, undoPendingDelete]
  );

  const handleEdit = useCallback((question) => {
    setMeta({
      difficulty: question.difficulty,
      subject: question.subject,
      tags: question.tags || "",
      bookName: question.bookName || "",
      bookEdition: question.bookEdition || "",
      isbn: question.isbn || "",
      etgNumber: question.etgNumber || "",
      pageNumber: question.pageNumber || "",
      questionNumber: question.questionNumber || "",
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

  const createSizeOffset = 3;
  const foundQuestionsLabel = t("questions found");
  const visibleQuestions = useMemo(
    () => state.questions.filter((question) => !pendingDeleteIds.includes(question.id)),
    [pendingDeleteIds, state.questions]
  );

  const renderMainForm = () => {
    if (state.activeType === TYPES.COMPREHENSIVE) {
      return (
        <ComprehensiveForm
          form={state.form}
          isDark={themeMode === "dark"}
          sizeOffset={createSizeOffset}
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
          {t("Answer Configuration")}
        </div>
        <AnswerConfiguration
          type={state.activeType}
          form={state.form}
          isDark={themeMode === "dark"}
          sizeOffset={createSizeOffset}
          onPatch={(value) => dispatch({ type: "FORM", value })}
        />
      </div>
    );
  };

  const renderMetadataForm = () => (
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
        {t("Reference Metadata")}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <Field
          label={t("Book Name")}
          value={meta.bookName}
          onChange={(event) => setMeta((current) => ({ ...current, bookName: event.target.value }))}
          placeholder={t("Book name")}
          sizeOffset={createSizeOffset}
        />
        <Field
          label={t("Book Edition")}
          value={meta.bookEdition}
          onChange={(event) => setMeta((current) => ({ ...current, bookEdition: event.target.value }))}
          placeholder={t("Enter book edition")}
          sizeOffset={createSizeOffset}
        />
        <Field
          label={t("ISBN")}
          value={meta.isbn}
          onChange={(event) => setMeta((current) => ({ ...current, isbn: event.target.value }))}
          placeholder={t("ISBN")}
          sizeOffset={createSizeOffset}
        />
        <Field
          label={t("Etg Number")}
          value={meta.etgNumber}
          onChange={(event) => setMeta((current) => ({ ...current, etgNumber: event.target.value }))}
          placeholder={t("Etg number")}
          sizeOffset={createSizeOffset}
        />
        <Field
          label={t("Page Number")}
          value={meta.pageNumber}
          onChange={(event) => setMeta((current) => ({ ...current, pageNumber: event.target.value }))}
          placeholder={t("Enter page number")}
          sizeOffset={createSizeOffset}
        />
        <Field
          label={t("Question Number")}
          value={meta.questionNumber}
          onChange={(event) => setMeta((current) => ({ ...current, questionNumber: event.target.value }))}
          placeholder={t("Question number")}
          sizeOffset={createSizeOffset}
        />
      </div>
    </div>
  );

  return (
    <>
      <TopNav
        isSidebarCollapsed={isSidebarCollapsed}
        language={language}
        setLanguage={setLanguage}
        t={t}
        fontScale={fontScale}
        setFontScale={setFontScale}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        totalQuestions={state.stats.total}
        view={state.view}
        goListView={goListView}
        goCreateView={goCreateView}
      />

      <Sidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        t={t}
        goListView={goListView}
        toggleSidebarSection={toggleSidebarSection}
        sidebarSections={sidebarSections}
        view={state.view}
        goCreateView={goCreateView}
        showToast={showToast}
      />

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
                  label={t("Total")}
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
                  label={t("True/False")}
                  value={state.stats.byType?.true_false || 0}
                  accent={statAccents.true_false}
                  active={state.filters.type === TYPES.TRUE_FALSE}
                  onClick={() => handleTypeCardFilter(TYPES.TRUE_FALSE)}
                />
                <StatCard
                  label={t("Multi-Correct")}
                  value={state.stats.byType?.multi_correct || 0}
                  accent={statAccents.multi_correct}
                  active={state.filters.type === TYPES.MULTI_CORRECT}
                  onClick={() => handleTypeCardFilter(TYPES.MULTI_CORRECT)}
                />
                <StatCard
                  label={t("Match Pair")}
                  value={state.stats.byType?.match_pair || 0}
                  accent={statAccents.match_pair}
                  active={state.filters.type === TYPES.MATCH_PAIR}
                  onClick={() => handleTypeCardFilter(TYPES.MATCH_PAIR)}
                />
                <StatCard
                  label={t("Sequence")}
                  value={state.stats.byType?.arrange_sequence || 0}
                  accent={statAccents.arrange_sequence}
                  active={state.filters.type === TYPES.ARRANGE_SEQUENCE}
                  onClick={() => handleTypeCardFilter(TYPES.ARRANGE_SEQUENCE)}
                />
                <StatCard
                  label={t("Comprehension")}
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
                    placeholder={t("Search questions...")}
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>
                {[
                  {
                    key: "difficulty",
                    options: [["", t("All Levels")], ...DIFFS.map((item) => [item, t(item)])],
                  },
                  {
                    key: "subject",
                    options: [["", t("All Subjects")], ...SUBJECTS.map((item) => [item, t(item)])],
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
              ) : visibleQuestions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 20px" }}>
                  <div style={{ color: "var(--text-muted)", fontSize: 18, fontWeight: 700 }}>
                    {t("No questions found")}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 8 }}>
                    {t('Click "New Question" to get started')}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    {visibleQuestions.length} {foundQuestionsLabel}
                  </div>
                  {visibleQuestions.map((question) => (
                    <Card
                      key={question.id}
                      question={question}
                      isDark={themeMode === "dark"}
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
              <h2 style={{ margin: "0 0 24px", fontWeight: 800, fontSize: 29 }}>
                {state.editingId ? t("Edit Question") : t("Create Question")}
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
                        fontSize: 16,
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
                      {t(TYPE_LABEL[type])}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <Field
                  label={t("Instruction (optional)")}
                  as="textarea"
                  rows={2}
                  value={state.form.instruction || ""}
                  onChange={(event) =>
                    dispatch({ type: "FORM", value: { instruction: event.target.value } })
                  }
                  placeholder={t("Add optional instructions for students...")}
                  sizeOffset={createSizeOffset}
                />
                <Field
                  label={
                    state.activeType === TYPES.COMPREHENSIVE
                      ? t("Statement / Passage *")
                      : t("Question *")
                  }
                  as="textarea"
                  rows={state.activeType === TYPES.COMPREHENSIVE ? 6 : 3}
                  value={state.form.question}
                  onChange={(event) =>
                    dispatch({ type: "FORM", value: { question: event.target.value } })
                  }
                  placeholder={
                    state.activeType === TYPES.COMPREHENSIVE
                      ? t("Enter the common statement or passage here...")
                      : t("Enter your question here...")
                  }
                  sizeOffset={createSizeOffset}
                />

                {renderMainForm()}

                {renderMetadataForm()}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <Field
                    label={t("Difficulty")}
                    as="select"
                    value={meta.difficulty}
                    onChange={(event) =>
                      setMeta((current) => ({ ...current, difficulty: event.target.value }))
                    }
                    sizeOffset={createSizeOffset}
                  >
                    {DIFFS.map((item) => (
                      <option key={item}>{t(item)}</option>
                    ))}
                  </Field>
                  <Field
                    label={t("Subject")}
                    as="select"
                    value={meta.subject}
                    onChange={(event) =>
                      setMeta((current) => ({ ...current, subject: event.target.value }))
                    }
                    sizeOffset={createSizeOffset}
                  >
                    {SUBJECTS.map((item) => (
                      <option key={item}>{t(item)}</option>
                    ))}
                  </Field>
                  <Field
                    label={state.activeType === TYPES.COMPREHENSIVE ? t("Total Points") : t("Points")}
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
                    sizeOffset={createSizeOffset}
                  />
                </div>

                <Field
                  label={t("Explanation (optional)")}
                  as="textarea"
                  rows={2}
                  value={state.form.explanation}
                  onChange={(event) =>
                    dispatch({ type: "FORM", value: { explanation: event.target.value } })
                  }
                  placeholder={
                    state.activeType === TYPES.COMPREHENSIVE
                      ? t("Optional explanation for the full passage...")
                      : t("Explain the correct answer...")
                  }
                  sizeOffset={createSizeOffset}
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
                        style={{ color: "var(--danger)", fontSize: 17, fontWeight: 600 }}
                      >
                        {error}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  <Btn
                    variant="secondary"
                    sizeOffset={createSizeOffset}
                    onClick={() => {
                      dispatch({ type: "VIEW", value: "list" });
                      dispatch({ type: "EDIT_CLEAR" });
                    }}
                  >
                    {t("Cancel")}
                  </Btn>
                  <Btn onClick={handleSave} disabled={state.saving} sizeOffset={createSizeOffset}>
                    {state.saving
                      ? t("Saving...")
                      : state.editingId
                        ? t("Update")
                        : t("Save Question")}
                  </Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {preview && (
        <Preview
          question={preview}
          isDark={themeMode === "dark"}
          onClose={() => setPreview(null)}
        />
      )}
      {state.toast && (
        <Toast
          msg={state.toast.msg}
          kind={state.toast.kind}
          actionLabel={state.toast.actionLabel}
          onAction={state.toast.onAction}
          onClose={closeToast}
        />
      )}
    </>
  );
}
