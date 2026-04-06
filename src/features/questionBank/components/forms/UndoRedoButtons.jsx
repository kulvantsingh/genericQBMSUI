import undoIcon from "../../../../assets/ui/undo.png";
import redoIcon from "../../../../assets/ui/redo.png";
import undoDarkIcon from "../../../../assets/ui/undo-dark.png";
import redoDarkIcon from "../../../../assets/ui/redo-dark.png";
import { useLocalization } from "../../contexts/localizationContext";

export function UndoIconButton({ onClick, disabled, isDark = false }) {
  const { t } = useLocalization();
  const iconSrc = isDark ? undoDarkIcon : undoIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={t("Undo")}
      aria-label={t("Undo")}
      style={{
        width: 35,
        height: 10,
        borderRadius: "50%",
        border: "none",
        background: "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
      }}
    >
      <img
        src={iconSrc}
        alt=""
        aria-hidden="true"
        style={{ width: 19, height: 19, objectFit: "contain" }}
      />
    </button>
  );
}

export function RedoIconButton({ onClick, disabled, isDark = false }) {
  const { t } = useLocalization();
  const iconSrc = isDark ? redoDarkIcon : redoIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={t("Redo")}
      aria-label={t("Redo")}
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        border: "none",
        background: "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
      }}
    >
      <img
        src={iconSrc}
        alt=""
        aria-hidden="true"
        style={{ width: 19, height: 19, objectFit: "contain" }}
      />
    </button>
  );
}
