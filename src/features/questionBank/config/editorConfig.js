import {
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  List,
  Link,
  Image,
  ImageUpload,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  Base64UploadAdapter,
  Alignment
} from "ckeditor5";
import MathlivePlugin from "../../../plugins/MathlivePlugin";

const editorPlugins = [
  Essentials, Paragraph, Bold, Italic, Underline,
  List, Link, Alignment,
  Image, ImageUpload, ImageResize, ImageStyle, ImageToolbar,
  Base64UploadAdapter,
  MathlivePlugin
];

export function getEditorConfig(placeholder, compact = false) {
  return {
    licenseKey: "GPL",
    plugins: editorPlugins,
    toolbar: compact
      ? ["bold", "italic", "underline", "|", "alignment", "|", "bulletedList", "numberedList", "|", "uploadImage", "|", "mathliveButton", "|", "undo", "redo"]
      : ["bold", "italic", "underline", "|", "alignment", "|", "bulletedList", "numberedList", "|", "link", "|", "uploadImage", "|", "mathliveButton", "|", "undo", "redo"],
    placeholder,
    image: {
      resizeOptions: [
        { name: "resizeImage:original", label: "Original", value: null },
        { name: "resizeImage:25",       label: "25%",      value: "25"  },
        { name: "resizeImage:50",       label: "50%",      value: "50"  },
        { name: "resizeImage:75",       label: "75%",      value: "75"  },
      ],
      toolbar: [
        "resizeImage",
        "|", "imageStyle:inline", "imageStyle:block",
      ],
    },
  };
}
