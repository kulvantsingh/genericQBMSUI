import { TYPES } from "./constants";
import { blank } from "./questionUtils";

export const INIT = {
  view: "list",
  questions: [],
  filters: { type: "", difficulty: "", subject: "", search: "" },
  activeType: TYPES.MCQ,
  form: blank.mcq(),
  editingId: null,
  errors: [],
  toast: null,
  stats: { total: 0, byType: {}, byDifficulty: {}, bySubject: {} },
  loading: false,
  saving: false,
};

export function reducer(state, action) {
  switch (action.type) {
    case "VIEW":
      return { ...state, view: action.value, errors: [] };
    case "QTYPE":
      return {
        ...state,
        activeType: action.value,
        form: blank[action.value](),
        errors: [],
      };
    case "FORM":
      return { ...state, form: { ...state.form, ...action.value } };
    case "ERRORS":
      return { ...state, errors: action.value };
    case "TOAST":
      return { ...state, toast: action.value };
    case "FILTER":
      return {
        ...state,
        filters: { ...state.filters, [action.key]: action.value },
      };
    case "QUESTIONS":
      return { ...state, questions: action.value, loading: false };
    case "STATS":
      return { ...state, stats: action.value };
    case "LOADING":
      return { ...state, loading: action.value };
    case "SAVING":
      return { ...state, saving: action.value };
    case "EDIT_START":
      return {
        ...state,
        view: "create",
        editingId: action.id,
        activeType: action.questionType,
        form: action.form,
        errors: [],
      };
    case "EDIT_CLEAR":
      return {
        ...state,
        editingId: null,
        form: blank[state.activeType](),
        errors: [],
      };
    default:
      return state;
  }
}
