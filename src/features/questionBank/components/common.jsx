import { useContext, useEffect, useId, useRef, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor } from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import crossIcon from "../../../assets/ui/cross.png";

import { EditorContext } from "../editorContext";
import { useLocalization } from "../localizationContext";
import { getEditorConfig } from "../editorConfig";
import { stripHtml } from "../questionUtils";

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

export function Spinner() {
  const { t } = useLocalization();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid var(--spinner-track)",
          borderTopColor: "var(--spinner-head)",
          animation: "spin .8s linear infinite",
        }}
      />
      <span style={{ color: "var(--text-muted)", fontSize: 14 }}>
        {t("Fetching from Spring Boot...")}
      </span>
    </div>
  );
}

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

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  as,
  rows,
  children,
  disabled,
  rich = as === "textarea" || type === "text",
  sizeOffset = 0,
}) {
  const editorContext = useContext(EditorContext);
  const fieldId = useId();
  const editorContainerRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const isRichEditorOpen = editorContext?.activeFieldId === fieldId;
  const [hasBeenOpened, setHasBeenOpened] = useState(false);

  const focusEditorAtEnd = (editor) => {
    if (!editor) return;

    requestAnimationFrame(() => {
      editor.model.change((writer) => {
        writer.setSelection(
          writer.createPositionAt(editor.model.document.getRoot(), "end")
        );
      });
      editor.editing.view.focus();
    });
  };

  useEffect(() => {
    if (!isRichEditorOpen) return;

    if (!hasBeenOpened) setHasBeenOpened(true);

    if (editorInstanceRef.current) {
      focusEditorAtEnd(editorInstanceRef.current);
    }
  }, [hasBeenOpened, isRichEditorOpen]);

  useEffect(() => {
    if (!isRichEditorOpen) return undefined;

    const handleClickOutside = (event) => {
      const target = event.target;

      if (target instanceof Element) {
        const trigger = target.closest("[data-rich-trigger='true']");
        if (trigger) {
          const nextFieldId = trigger.getAttribute("data-rich-field-id");
          if (nextFieldId) {
            editorContext?.setActiveFieldId(nextFieldId);
            return;
          }
        }
      }

      if (
        editorContainerRef.current &&
        target instanceof Node &&
        editorContainerRef.current.contains(target)
      ) {
        return;
      }

      if (target instanceof Element && target.closest("button")) {
        return;
      }

      if (target instanceof Element && target.closest(".ck-body-wrapper")) {
        return;
      }

      editorContext?.setActiveFieldId(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [editorContext, isRichEditorOpen]);

  const style = {
    width: "100%",
    background: "var(--input-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: 10,
    padding: "8px 12px",
    color: "var(--text-primary)",
    fontSize: 14 + sizeOffset,
    outline: "none",
    fontFamily: "inherit",
    resize: as === "textarea" ? "vertical" : undefined,
    boxSizing: "border-box",
    opacity: disabled ? 0.65 : 1,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label style={{ color: "var(--text-secondary)", fontSize: 13 + sizeOffset, fontWeight: 600 }}>
          {label}
        </label>
      )}
      {as === "select" ? (
        <select value={value} onChange={onChange} style={style} disabled={disabled}>
          {children}
        </select>
      ) : rich ? (
        <>
          {(hasBeenOpened || isRichEditorOpen) && (
            <div
              ref={editorContainerRef}
              className={`inline-rich-editor ${
                as === "textarea"
                  ? "inline-rich-editor--expanded"
                  : "inline-rich-editor--compact"
              }`}
              style={{
                width: "100%",
                opacity: disabled ? 0.65 : 1,
                overflow: "hidden",
                display: isRichEditorOpen ? "block" : "none",
              }}
            >
              <CKEditor
                editor={ClassicEditor}
                config={getEditorConfig(placeholder, as !== "textarea")}
                data={value || ""}
                onReady={(editor) => {
                  editorInstanceRef.current = editor;
                  focusEditorAtEnd(editor);
                }}
                onChange={(_, editor) => onChange?.({ target: { value: editor.getData() } })}
              />
            </div>
          )}
          {!isRichEditorOpen && (
            <button
              type="button"
              onClick={() => {
                if (disabled) return;
                setHasBeenOpened(true);
                editorContext?.setActiveFieldId(fieldId);
              }}
              disabled={disabled}
              data-rich-trigger="true"
              data-rich-field-id={fieldId}
              style={{
                width: "100%",
                border: "1px solid var(--border-color)",
                borderRadius: 10,
                background: "var(--input-bg)",
                opacity: disabled ? 0.65 : 1,
                minHeight: 38,
                padding: "8px 12px",
                color: "var(--text-primary)",
                fontSize: 14 + sizeOffset,
                textAlign: "left",
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {stripHtml(value || "") ? (
                <div
                  className="inline-rich-preview-content"
                  style={{ color: "var(--text-primary)" }}
                  dangerouslySetInnerHTML={{ __html: value || "" }}
                />
              ) : (
                <div className="inline-rich-preview-placeholder" style={{ color: "var(--text-muted)" }}>
                  {placeholder || "Click to edit"}
                </div>
              )}
            </button>
          )}
        </>
      ) : as === "textarea" ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows || 3}
          style={style}
          disabled={disabled}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={style}
          disabled={disabled}
        />
      )}
    </div>
  );
}
