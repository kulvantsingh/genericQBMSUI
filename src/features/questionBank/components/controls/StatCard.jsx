export function StatCard({ label, value, accent, onClick, active }) {
  const cardStyle = {
    background: `linear-gradient(180deg, color-mix(in srgb, var(--surface-bg) 94%, ${accent} 6%), var(--surface-bg))`,
    border: `1px solid ${
      active
        ? `color-mix(in srgb, ${accent} 52%, var(--border-color) 48%)`
        : `color-mix(in srgb, ${accent} 24%, var(--border-color) 76%)`
    }`,
    borderRadius: 16,
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    boxShadow: active
      ? `0 0 0 2px color-mix(in srgb, ${accent} 26%, transparent)`
      : "none",
  };

  const content = (
    <>
      <span
        style={{
          color: accent,
          fontSize: 28,
          fontWeight: 800,
          fontFamily: "'Segoe UI', sans-serif",
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
    </>
  );

  if (!onClick) {
    return <div style={cardStyle}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        ...cardStyle,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      {content}
    </button>
  );
}
