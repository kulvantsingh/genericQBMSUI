import crossIcon from "../../../../assets/ui/cross.png";
import { useLocalization } from "../../contexts/localizationContext";

export function Toast({ msg, kind, onClose, actionLabel, onAction }) {
  const { t } = useLocalization();
  const background =
    kind === "error" ? "var(--danger)" : kind === "warn" ? "var(--warning)" : "var(--success)";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 9999,
        background,
        color: kind === "error" ? "var(--button-primary-text)" : "var(--toast-on-accent)",
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
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            border: "1px solid color-mix(in srgb, var(--surface-bg) 65%, transparent)",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
            padding: "6px 12px",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            opacity: 1,
            transition: "0.15s",
            background: "var(--surface-bg)",
            color: "var(--warning)",
            boxShadow: "0 2px 10px rgba(0,0,0,.12)",
          }}
        >
          {actionLabel}
        </button>
      )}
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
        <img
          src={crossIcon}
          alt={t("Close")}
          aria-hidden="true"
          style={{ width: 16, height: 16, objectFit: "contain" }}
        />
      </button>
    </div>
  );
}
