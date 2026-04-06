function SunIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8z" />
    </svg>
  );
}

import { useLocalization } from "../../contexts/localizationContext";

export function ThemeToggle({ isDark, onToggle }) {
  const { t } = useLocalization();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? t("Switch to light mode") : t("Switch to dark mode")}
      aria-pressed={isDark}
      title={isDark ? t("Dark mode enabled") : t("Light mode enabled")}
      style={{
        position: "relative",
        width: 74,
        height: 36,
        borderRadius: 999,
        border: "1px solid var(--border-color)",
        background: "var(--surface-alt-bg)",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 10px",
          color: "var(--text-muted)",
        }}
      >
        <span style={{ opacity: isDark ? 0.45 : 1, transition: "opacity .2s ease" }}>
          <SunIcon />
        </span>
        <span style={{ opacity: isDark ? 1 : 0.45, transition: "opacity .2s ease" }}>
          <MoonIcon />
        </span>
      </span>
      <span
        style={{
          position: "absolute",
          top: 3,
          left: 3,
          width: 28,
          height: 28,
          borderRadius: 999,
          background: "var(--brand-gradient)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--button-primary-text)",
          transform: `translateX(${isDark ? 38 : 0}px)`,
          transition: "transform .24s ease",
          boxShadow: "0 4px 12px rgba(0,0,0,.2)",
        }}
      >
        {isDark ? <MoonIcon color="currentColor" /> : <SunIcon color="currentColor" />}
      </span>
    </button>
  );
}
