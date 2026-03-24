import mcqIcon from "../../assets/type-icons/mcq.png";
import trueFalseIcon from "../../assets/type-icons/true_false.png";
import multiCorrectIcon from "../../assets/type-icons/multi_correct.png";
import matchPairIcon from "../../assets/type-icons/match_pair.png";
import arrangeSequenceIcon from "../../assets/type-icons/arrange_sequence.png";
import comprehensiveIcon from "../../assets/type-icons/comprehensive.png";

export const BASE_URL = "http://localhost:8082/api/v1/questions";

export const TYPES = {
  MCQ: "mcq",
  MULTI_CORRECT: "multi_correct",
  TRUE_FALSE: "true_false",
  MATCH_PAIR: "match_pair",
  ARRANGE_SEQUENCE: "arrange_sequence",
  COMPREHENSIVE: "comprehensive",
};

export const CHILD_TYPES = [
  TYPES.MCQ,
  TYPES.MULTI_CORRECT,
  TYPES.TRUE_FALSE,
  TYPES.MATCH_PAIR,
  TYPES.ARRANGE_SEQUENCE,
];

export const TYPE_LABEL = {
  mcq: "Single Correct",
  multi_correct: "Multiple Correct",
  true_false: "True / False",
  match_pair: "Match the Pair",
  arrange_sequence: "Arrange the Sequence",
  comprehensive: "Comprehensive",
};

export const TYPE_ICON = {
  mcq: mcqIcon,
  multi_correct: multiCorrectIcon,
  true_false: trueFalseIcon,
  match_pair: matchPairIcon,
  arrange_sequence: arrangeSequenceIcon,
  comprehensive: comprehensiveIcon,
};

export const TYPE_COLOR = {
  mcq: "#992f70",
  multi_correct: "#992f70",
  true_false: "#992f70",
  match_pair: "#992f70",
  arrange_sequence: "#992f70",
  comprehensive: "#992f70",
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
  padding: "8px 12px",
  color: "var(--text-primary)",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
};

export const removeButtonStyle = {
  background: "none",
  border: "none",
  color: "var(--danger)",
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
    "--app-bg": "#0b1120",
    "--nav-bg": "#0f172a",
    "--surface-bg": "#111b2e",
    "--surface-alt-bg": "#0c1627",
    "--surface-strong-bg": "#0b1425",
    "--border-color": "#24324b",
    "--border-strong": "#334765",
    "--text-primary": "#e6edf7",
    "--text-secondary": "#b7c4db",
    "--text-muted": "#8fa0bb",
    "--text-soft": "#c8d3e6",
    "--pill-bg": "#1b2a43",
    "--input-bg": "#0f1a2d",
    "--editor-toolbar-bg": "#16243a",
    "--editor-bg": "#0e1a2f",
    "--editor-hover": "#243a5a",
    "--scroll-track": "#0b1120",
    "--scroll-thumb": "#334a72",
    "--sidebar-accent": "#79a6ff",
    "--sidebar-active-bg": "#1a2a45",
    "--brand-primary": "#7c6aff",
    "--brand-secondary": "#5b4fff",
    "--brand-accent": "#9c8eff",
    "--brand-soft": "#2a3060",
    "--brand-gradient": "linear-gradient(135deg,#7c6aff,#5b4fff)",
    "--focus-ring": "#7c6aff",
    "--focus-ring-soft": "#7c6aff22",
    "--danger": "#ff3b5c",
    "--danger-soft-bg": "#ff3b5c22",
    "--danger-border": "#ff3b5c44",
    "--success": "#00e5a0",
    "--warning": "#f59e0b",
    "--spinner-track": "#1e2540",
    "--spinner-head": "#7c6aff",
    "--button-primary-text": "#ffffff",
    "--toast-on-accent": "#0a0e1a",
    "--option-single-accent": "#00e5a0",
    "--option-multi-accent": "#00e5a0",
    "--option-multi-text": "#0a0e1a",
    "--sequence-accent": "#ffd166",
    "--card-correct-accent": "#00e5a0",
    "--card-multi-accent": "#00e5a0",
    "--card-pair-left": "#ff6b9d",
    "--card-pair-right": "#7c6aff",
    "--card-sequence-accent": "#ffd166",
    "--type-icon-filter": "brightness(0) invert(1)",
  },
  light: {
    "--app-bg": "#EFF0F6",
    "--nav-bg": "#ffffff",
    "--surface-bg": "#ffffff",
    "--surface-alt-bg": "#f6f7fc",
    "--surface-strong-bg": "#ffffff",
    "--border-color": "#d4dbea",
    "--border-strong": "#bcc6de",
    "--text-primary": "#40404c",
    "--text-secondary": "#5d647a",
    "--text-muted": "#7d8498",
    "--text-soft": "#69708a",
    "--pill-bg": "#f2f4fb",
    "--input-bg": "#ffffff",
    "--editor-toolbar-bg": "#eceff8",
    "--editor-bg": "#ffffff",
    "--editor-hover": "#dfe5f2",
    "--scroll-track": "#e3e7f2",
    "--scroll-thumb": "#aab4cc",
    "--sidebar-accent": "#9a3e76",
    "--sidebar-active-bg": "#f0edf8",
    "--brand-primary": "#9a3e76",
    "--brand-secondary": "#577cb7",
    "--brand-accent": "#d4a0bc",
    "--brand-soft": "#cca4cc",
    "--brand-gradient": "linear-gradient(135deg,#9A3E76,#577CB7)",
    "--focus-ring": "#577cb7",
    "--focus-ring-soft": "#577cb733",
    "--danger": "#9a3e76",
    "--danger-soft-bg": "#9a3e7622",
    "--danger-border": "#9a3e7648",
    "--success": "#577cb7",
    "--warning": "#b16c96",
    "--spinner-track": "#d4a0bc",
    "--spinner-head": "#577cb7",
    "--button-primary-text": "#ffffff",
    "--toast-on-accent": "#ffffff",
    "--option-single-accent": "#9a3e76",
    "--option-multi-accent": "#9a3e76",
    "--option-multi-text": "#ffffff",
    "--sequence-accent": "#b16c96",
    "--card-correct-accent": "#9a3e76",
    "--card-multi-accent": "#9a3e76",
    "--card-pair-left": "#9a3e76",
    "--card-pair-right": "#9a3e76",
    "--card-sequence-accent": "#b16c96",
    "--type-icon-filter": "none",
  },
};

export const DEFAULT_META = {
  difficulty: "Medium",
  subject: "General Knowledge",
  tags: "",
};
