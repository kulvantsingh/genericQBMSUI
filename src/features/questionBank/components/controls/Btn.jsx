export function Btn({
  children,
  onClick,
  variant = "primary",
  small,
  ghost,
  danger,
  disabled,
  type = "button",
  sizeOffset = 0,
}) {
  const base = {
    border: "none",
    borderRadius: small ? 8 : 12,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700,
    fontSize: (small ? 13 : 15) + sizeOffset,
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
          background: "var(--danger-soft-bg)",
          color: "var(--danger)",
          border: "1px solid var(--danger-border)",
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
        background: "var(--brand-gradient)",
        color: "var(--button-primary-text)",
      }}
    >
      {children}
    </button>
  );
}
