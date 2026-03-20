export const BASE_URL = "http://localhost:8082/api/v1/questions";

export const TYPES = {
  MCQ: "mcq",
  TRUE_FALSE: "true_false",
  MULTI_CORRECT: "multi_correct",
  MATCH_PAIR: "match_pair",
  ARRANGE_SEQUENCE: "arrange_sequence",
  COMPREHENSIVE: "comprehensive",
};

export const CHILD_TYPES = [
  TYPES.MCQ,
  TYPES.TRUE_FALSE,
  TYPES.MULTI_CORRECT,
  TYPES.MATCH_PAIR,
  TYPES.ARRANGE_SEQUENCE,
];

export const TYPE_LABEL = {
  mcq: "Multiple Choice",
  true_false: "True / False",
  multi_correct: "Multi-Correct",
  match_pair: "Match the Pair",
  arrange_sequence: "Arrange the Sequence",
  comprehensive: "Comprehensive",
};

export const TYPE_ICON = {
  mcq: "O",
  true_false: "T/F",
  multi_correct: "M",
  match_pair: "P",
  arrange_sequence: "S",
  comprehensive: "C",
};

export const TYPE_COLOR = {
  mcq: "#7c6aff",
  true_false: "#00e5a0",
  multi_correct: "#ff9f43",
  match_pair: "#ff6b9d",
  arrange_sequence: "#ffd166",
  comprehensive: "#4cc9f0",
};

export const DIFFS = ["Easy", "Medium", "Hard"];

export const SUBJECTS = [
  "Mathematics",
  "Science",
  "History",
  "Geography",
  "Literature",
  "Computer Science",
  "General Knowledge",
  "Other",
];

export const inputStyle = {
  flex: 1,
  background: "var(--input-bg)",
  border: "1px solid var(--border-color)",
  borderRadius: 10,
  padding: "10px 14px",
  color: "var(--text-primary)",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
};

export const removeButtonStyle = {
  background: "none",
  border: "none",
  color: "#ff3b5c",
  cursor: "pointer",
  fontSize: 18,
};

export const pillStyle = {
  background: "var(--pill-bg)",
  color: "var(--text-secondary)",
  padding: "3px 10px",
  borderRadius: 20,
  fontSize: 12,
};

export const THEME_VARS = {
  dark: {
    "--app-bg": "#0a0e1a",
    "--nav-bg": "#0d1021",
    "--surface-bg": "#13172b",
    "--surface-alt-bg": "#0d1021",
    "--surface-strong-bg": "#0f1424",
    "--border-color": "#1e2540",
    "--border-strong": "#24304f",
    "--text-primary": "#d4daf7",
    "--text-secondary": "#7a84a8",
    "--text-muted": "#4a5278",
    "--text-soft": "#9aa0c4",
    "--pill-bg": "#1e2540",
    "--input-bg": "#0d1021",
    "--editor-toolbar-bg": "#141b31",
    "--editor-bg": "#0d1324",
    "--editor-hover": "#24304f",
    "--scroll-track": "#0a0e1a",
    "--scroll-thumb": "#2a3060",
  },
  light: {
    "--app-bg": "#f4f7fb",
    "--nav-bg": "#ffffff",
    "--surface-bg": "#ffffff",
    "--surface-alt-bg": "#f7f9fc",
    "--surface-strong-bg": "#ffffff",
    "--border-color": "#d8e1ee",
    "--border-strong": "#c7d3e6",
    "--text-primary": "#172033",
    "--text-secondary": "#51607e",
    "--text-muted": "#73819d",
    "--text-soft": "#5e6d89",
    "--pill-bg": "#edf2fa",
    "--input-bg": "#ffffff",
    "--editor-toolbar-bg": "#eef3fa",
    "--editor-bg": "#ffffff",
    "--editor-hover": "#dfe8f5",
    "--scroll-track": "#eef3fa",
    "--scroll-thumb": "#c4d0e3",
  },
};

export const DEFAULT_META = {
  difficulty: "Medium",
  subject: "General Knowledge",
  tags: "",
};
