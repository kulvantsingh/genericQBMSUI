import { useLocalization } from "../../contexts/localizationContext";

export function TrueFalseForm({ form, onPatch, sizeOffset = 0 }) {
  const { t } = useLocalization();
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
            fontSize: 18 + sizeOffset,
            cursor: "pointer",
            border: `2px solid ${
              form.correctAnswer === value
                ? value
                  ? "var(--success)"
                  : "var(--danger)"
                : "var(--border-color)"
            }`,
            background:
              form.correctAnswer === value
                ? value
                  ? "color-mix(in srgb, var(--success) 16%, transparent)"
                  : "var(--danger-soft-bg)"
                : "var(--surface-alt-bg)",
            color:
              form.correctAnswer === value
                ? value
                  ? "var(--success)"
                  : "var(--danger)"
                : "var(--text-secondary)",
          }}
        >
          {value ? t("True") : t("False")}
        </button>
      ))}
    </div>
  );
}
