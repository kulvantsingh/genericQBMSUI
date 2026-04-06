import { useContext, useEffect, useId, useRef, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor } from "ckeditor5";
import "ckeditor5/ckeditor5.css";

import { EditorContext } from "../../contexts/editorContext";
import { getEditorConfig } from "../../config/editorConfig";
import { stripHtml } from "../../utils/questionUtils";

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
