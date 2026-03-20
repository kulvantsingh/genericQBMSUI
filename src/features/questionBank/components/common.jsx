import { useContext, useEffect, useId, useRef, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor } from "ckeditor5";
import "ckeditor5/ckeditor5.css";

import { EditorContext } from "../editorContext";
import { getEditorConfig } from "../editorConfig";
import { stripHtml } from "../questionUtils";

export function Toast({ msg, kind, onClose }) {
  const background =
    kind === "error" ? "#ff3b5c" : kind === "warn" ? "#f59e0b" : "#00e5a0";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 9999,
        background,
        color: kind === "error" ? "#fff" : "#0a0e1a",
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
        x
      </button>
    </div>
  );
}

export function Spinner() {
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
          border: "3px solid #1e2540",
          borderTopColor: "#7c6aff",
          animation: "spin .8s linear infinite",
        }}
      />
      <span style={{ color: "var(--text-muted)", fontSize: 14 }}>
        Fetching from Spring Boot...
      </span>
    </div>
  );
}

export function StatCard({ label, value, accent }) {
  return (
    <div
      style={{
        background: "var(--surface-bg)",
        border: `1px solid ${accent}33`,
        borderRadius: 16,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span
        style={{
          color: accent,
          fontSize: 28,
          fontWeight: 800,
          fontFamily: "'Space Mono', monospace",
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
    </div>
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
}) {
  const base = {
    border: "none",
    borderRadius: small ? 8 : 12,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700,
    fontSize: small ? 13 : 15,
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
          background: "#ff3b5c22",
          color: "#ff3b5c",
          border: "1px solid #ff3b5c33",
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
        background: "linear-gradient(135deg,#7c6aff,#5b4fff)",
        color: "#fff",
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
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    resize: as === "textarea" ? "vertical" : undefined,
    boxSizing: "border-box",
    opacity: disabled ? 0.65 : 1,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600 }}>
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
                border: "1px solid var(--border-color)",
                borderRadius: 10,
                background: "var(--input-bg)",
                opacity: disabled ? 0.65 : 1,
                overflow: "hidden",
                display: isRichEditorOpen ? "block" : "none",
              }}
            >
              <div style={{ padding: 6 }}>
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
                minHeight: 42,
                padding: "8px 12px",
                color: "var(--text-primary)",
                textAlign: "left",
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {stripHtml(value || "") ? (
                <div
                  style={{ color: "var(--text-primary)", lineHeight: 1.5 }}
                  dangerouslySetInnerHTML={{ __html: value || "" }}
                />
              ) : (
                <div style={{ color: "var(--text-muted)" }}>
                  {placeholder || "Click to edit in CKEditor"}
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
