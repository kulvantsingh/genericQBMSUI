import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor } from "ckeditor5";
import "ckeditor5/ckeditor5.css";

import { getEditorConfig } from "../editorConfig";
import { Btn } from "./common";

export function SharedEditor({ activeEditor, onClose }) {
  if (!activeEditor) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        width: "min(560px, calc(100vw - 48px))",
        maxHeight: "70vh",
        zIndex: 1200,
        background: "var(--surface-strong-bg)",
        border: "1px solid var(--border-strong)",
        borderRadius: 18,
        boxShadow: "0 24px 80px rgba(0,0,0,.45)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 16px",
          borderBottom: "1px solid var(--border-color)",
          background: "linear-gradient(180deg,var(--surface-bg),var(--surface-alt-bg))",
        }}
      >
        <div>
          <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>{activeEditor.label}</div>
          <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>Shared CKEditor panel</div>
        </div>
        <Btn small ghost onClick={onClose}>
          Close
        </Btn>
      </div>
      <div style={{ padding: 12 }}>
        <CKEditor
          key={activeEditor.sessionKey}
          editor={ClassicEditor}
          config={getEditorConfig(activeEditor.placeholder, activeEditor.compact)}
          data={activeEditor.value || ""}
          onReady={(editor) => {
            editor.model.change((writer) => {
              writer.setSelection(
                writer.createPositionAt(editor.model.document.getRoot(), "end")
              );
            });
            editor.editing.view.focus();
          }}
          onChange={(_, editor) => activeEditor.onChange(editor.getData())}
        />
      </div>
    </div>
  );
}
