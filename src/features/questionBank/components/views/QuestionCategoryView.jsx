import { useMemo, useState } from "react";

import { DIFFS } from "../../utils/constants";
import { stripHtml } from "../../utils/questionUtils";
import { Card } from "./Card";
import { Spinner } from "../feedback/Spinner";

function matchesSearch(question, searchText) {
  const query = searchText.trim().toLowerCase();
  if (!query) return true;

  const haystack = [
    stripHtml(question.question || ""),
    stripHtml(question.instruction || ""),
    stripHtml(question.explanation || ""),
    question.id,
    question.type,
    question.subject,
    question.difficulty,
    question.tags,
    question.bookName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function getLevelTone(themeMode, level) {
  if (level === "Easy") {
    return themeMode === "dark"
      ? { accent: "#34d399", soft: "rgba(52, 211, 153, 0.14)", text: "#a7f3d0" }
      : { accent: "#2f8f68", soft: "rgba(47, 143, 104, 0.12)", text: "#2f8f68" };
  }

  if (level === "Medium") {
    return themeMode === "dark"
      ? { accent: "#fbbf24", soft: "rgba(251, 191, 36, 0.14)", text: "#fde68a" }
      : { accent: "#b7791f", soft: "rgba(183, 121, 31, 0.12)", text: "#9a6518" };
  }

  if (level === "Hard") {
    return themeMode === "dark"
      ? { accent: "#fb7185", soft: "rgba(251, 113, 133, 0.14)", text: "#fecdd3" }
      : { accent: "#c05668", soft: "rgba(192, 86, 104, 0.12)", text: "#b2475b" };
  }

  return themeMode === "dark"
    ? { accent: "var(--brand-primary)", soft: "rgba(124, 106, 255, 0.14)", text: "var(--text-secondary)" }
    : { accent: "var(--brand-primary)", soft: "rgba(154, 62, 118, 0.12)", text: "var(--text-secondary)" };
}

function getCategoryCardTone(themeMode, active) {
  if (themeMode === "dark") {
    return active
      ? {
          background:
            "linear-gradient(145deg, rgba(124, 106, 255, 0.24), rgba(58, 74, 126, 0.3) 55%, rgba(17, 27, 46, 0.96))",
          border: "1px solid rgba(124, 106, 255, 0.7)",
          shadow: "0 0 0 2px rgba(124, 106, 255, 0.14)",
          value: "#8f7dff",
        }
      : {
          background:
            "linear-gradient(145deg, rgba(22, 36, 58, 0.95), rgba(15, 26, 45, 0.98) 65%, rgba(11, 20, 37, 1))",
          border: "1px solid rgba(51, 71, 101, 0.78)",
          shadow: "none",
          value: "var(--text-primary)",
        };
  }

  return active
    ? {
        background:
          "linear-gradient(145deg, rgba(154, 62, 118, 0.14), rgba(212, 160, 188, 0.2) 55%, rgba(255, 255, 255, 0.98))",
        border: "1px solid rgba(154, 62, 118, 0.42)",
        shadow: "0 0 0 2px rgba(154, 62, 118, 0.1)",
        value: "#9a3e76",
      }
    : {
        background:
          "linear-gradient(145deg, rgba(246, 247, 252, 0.95), rgba(240, 242, 249, 0.98) 60%, rgba(255, 255, 255, 1))",
        border: "1px solid rgba(188, 198, 222, 0.82)",
        shadow: "none",
        value: "var(--text-primary)",
      };
}

export function QuestionCategoryView({
  t,
  themeMode,
  subjects,
  selectedSubject,
  onSelectSubject,
  questions,
  loading,
  onEdit,
  onDelete,
  onPreview,
}) {
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  const levelCounts = useMemo(
    () =>
      DIFFS.reduce((accumulator, level) => {
        accumulator[level] = questions.filter((question) => question.difficulty === level).length;
        return accumulator;
      }, {}),
    [questions]
  );

  const filteredQuestions = useMemo(
    () =>
      questions.filter((question) => {
        if (selectedLevel && question.difficulty !== selectedLevel) return false;
        return matchesSearch(question, search);
      }),
    [questions, search, selectedLevel]
  );

  const selectedSubjectCount =
    subjects.find((item) => item.value === selectedSubject)?.count ?? questions.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section
        style={{
          background:
            themeMode === "dark"
              ? "rgba(20,10,40,0.7)"
              : "linear-gradient(160deg, rgba(255, 255, 255, 0.98), rgba(248, 249, 253, 0.98) 62%, rgba(244, 238, 246, 0.9))",
          border: "1px solid var(--border-color)",
          borderRadius: 20,
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          backdropFilter: "blur(12px)",
          outline:
            themeMode === "dark"
              ? "1px solid rgba(247,37,133,0.5)"
              : "1px solid rgba(247,37,133,0.35)",
          boxShadow:
            themeMode === "dark"
              ? "inset 0 0 0 1px rgba(114,9,183,0.6), 0 0 20px rgba(114,9,183,0.25),0 0 40px rgba(247,37,133,0.1)"
              : "inset 0 0 0 1px rgba(114,9,183,0.2), 0 2px 20px rgba(114,9,183,0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              {t("Subject")}
            </div>
            <h2 style={{ margin: 0, fontSize: 30, fontWeight: 800 }}>{t("Question Category")}</h2>
            <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 8 }}>
              {t(selectedSubject)} - {selectedSubjectCount} {t("questions found")}
            </div>
          </div>

          <div
            style={{
              minWidth: 220,
              padding: "16px 18px",
              borderRadius: 16,
              background:
                themeMode === "dark"
                  ? "linear-gradient(135deg, rgba(121,166,255,0.16), rgba(17,27,46,0.96))"
                  : "linear-gradient(135deg, rgba(154,62,118,0.12), rgba(255,255,255,0.96))",
              border: "1px solid var(--border-color)",
            }}
          >
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {t("Total Questions")}
            </div>
            <div
              style={{
                marginTop: 10,
                color: "var(--brand-primary)",
                fontSize: 34,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {selectedSubjectCount}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 8 }}>
              {t(selectedSubject)}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 14,
          }}
        >
          {subjects.map((subject) => {
            const active = subject.value === selectedSubject;
            const tone = getCategoryCardTone(themeMode, active);
            return (
              <button
                key={subject.value}
                type="button"
                onClick={() => onSelectSubject(subject.value)}
                aria-pressed={active}
                style={{
                  borderRadius: 16,
                  border: tone.border,
                  background: tone.background,
                  padding: "18px 16px",
                  textAlign: "left",
                  cursor: "pointer",
                  boxShadow: tone.shadow,
                }}
              >
                <div
                  style={{
                    color: tone.value,
                    fontSize: 24,
                    fontWeight: 800,
                    lineHeight: 1,
                    marginBottom: 10,
                  }}
                >
                  {subject.count}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: 14, fontWeight: 700 }}>
                  {t(subject.value)}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section
        style={{
          background: "var(--surface-bg)",
          borderRadius: 16,
          border: "1px solid var(--border-color)",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              {t("Difficulty")}
            </div>
            <div
              style={{
                color: selectedLevel ? getLevelTone(themeMode, selectedLevel).text : "var(--text-muted)",
                fontSize: 14,
                fontWeight: selectedLevel ? 700 : 500,
              }}
            >
              {selectedLevel ? t(selectedLevel) : t("All Levels")}
            </div>
          </div>

          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--pill-bg)",
              border: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {filteredQuestions.length} {t("questions found")}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {[
            { value: "", label: t("All Levels"), count: questions.length },
            ...DIFFS.map((level) => ({
              value: level,
              label: t(level),
              count: levelCounts[level] || 0,
            })),
          ].map((level) => {
            const active = selectedLevel === level.value;
            const tone = getLevelTone(themeMode, level.value);
            return (
              <button
                key={level.value || "all-levels"}
                type="button"
                onClick={() => setSelectedLevel(level.value)}
                aria-pressed={active}
                style={{
                  border: active
                    ? `1px solid color-mix(in srgb, ${tone.accent} 52%, var(--border-color) 48%)`
                    : "1px solid var(--border-color)",
                  background: active
                    ? `linear-gradient(180deg, color-mix(in srgb, ${tone.accent} 12%, var(--surface-bg) 88%), var(--surface-bg))`
                    : `linear-gradient(180deg, color-mix(in srgb, ${tone.accent} 6%, var(--surface-alt-bg) 94%), var(--surface-alt-bg))`,
                  color: active ? tone.accent : tone.text,
                  borderRadius: 999,
                  padding: "10px 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow: active
                    ? `0 0 0 2px color-mix(in srgb, ${tone.accent} 16%, transparent)`
                    : "none",
                }}
              >
                <span>{level.label}</span>
                <span
                  style={{
                    minWidth: 24,
                    height: 24,
                    padding: "0 7px",
                    borderRadius: 999,
                    background: active ? tone.accent : tone.soft,
                    color: active ? "var(--button-primary-text)" : tone.text,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    boxSizing: "border-box",
                  }}
                >
                  {level.count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1, minWidth: 240 }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("Search questions...")}
            style={{
              width: "100%",
              background: "var(--input-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: 10,
              padding: "10px 14px",
              color: "var(--text-primary)",
              fontSize: 15,
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>
      </section>

      {loading ? (
        <Spinner />
      ) : filteredQuestions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "72px 20px" }}>
          <div style={{ color: "var(--text-muted)", fontSize: 18, fontWeight: 700 }}>
            {t("No questions found")}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredQuestions.map((question) => (
            <Card
              key={question.id}
              question={question}
              isDark={themeMode === "dark"}
              onEdit={onEdit}
              onDelete={onDelete}
              onPreview={onPreview}
            />
          ))}
        </div>
      )}
    </div>
  );
}
