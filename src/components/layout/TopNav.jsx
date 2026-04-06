import React from "react";
import cdacLogo from "../../assets/cdac.png";
import { ThemeToggle, Btn } from "../../features/questionBank/components";
import { LANGUAGE_OPTIONS } from "../../features/questionBank/config/i18n";

export function TopNav({
  isSidebarCollapsed,
  language,
  setLanguage,
  t,
  fontScale,
  setFontScale,
  themeMode,
  setThemeMode,
  totalQuestions,
  view,
  goListView,
  goCreateView,
}) {
  const totalQuestionsLabel = t("Total Questions");

  return (
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
          <div className="app-top-nav-title">{t("Question Bank")}</div>
          <div className="app-top-nav-subtitle">
            {totalQuestions} {totalQuestionsLabel}
          </div>
        </div>
      </div>
      <div className="app-top-nav-actions">
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          aria-label={t("Language")}
          title={t("Language")}
          style={{
            background: "var(--input-bg)",
            border: "1px solid var(--border-color)",
            borderRadius: 10,
            padding: "10px 12px",
            color: "var(--text-primary)",
            fontSize: 14,
            outline: "none",
            cursor: "pointer",
          }}
        >
          {LANGUAGE_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
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
        {view !== "list" ? (
          <Btn variant="secondary" onClick={goListView}>
            {t("Back")}
          </Btn>
        ) : (
          <Btn onClick={goCreateView}>+ {t("New Question")}</Btn>
        )}
      </div>
    </div>
  );
}
