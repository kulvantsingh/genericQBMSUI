import {
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  List,
  Link,
} from "ckeditor5";

const editorPlugins = [Essentials, Paragraph, Bold, Italic, Underline, List, Link];

export function getEditorConfig(placeholder, compact = false) {
  return {
    licenseKey: "GPL",
    plugins: editorPlugins,
    toolbar: compact
      ? ["bold", "italic", "underline", "|", "bulletedList", "numberedList", "|", "undo", "redo"]
      : ["bold", "italic", "underline", "|", "bulletedList", "numberedList", "|", "link", "|", "undo", "redo"],
    placeholder,
  };
}
