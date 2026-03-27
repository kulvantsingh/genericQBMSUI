import { TYPES } from "./constants";
import { blank } from "./questionUtils";

function cloneForm(value) {
  return JSON.parse(JSON.stringify(value));
}

function createFormsByType() {
  return {
    [TYPES.MCQ]: blank.mcq(),
    [TYPES.MULTI_CORRECT]: blank.multi_correct(),
    [TYPES.TRUE_FALSE]: blank.true_false(),
    [TYPES.MATCH_PAIR]: blank.match_pair(),
    [TYPES.ARRANGE_SEQUENCE]: blank.arrange_sequence(),
    [TYPES.COMPREHENSIVE]: blank.comprehensive(),
  };
}

function mapSingleAndMultiForm(fromType, toType, form) {
  const options =
    Array.isArray(form.options) && form.options.length > 0
      ? [...form.options]
      : ["", "", "", ""];

  const base = {
    question: form.question || "",
    instruction: form.instruction || "",
    options,
    explanation: form.explanation || "",
    points: Math.max(1, Number(form.points) || 1),
  };

  if (toType === TYPES.MULTI_CORRECT) {
    const nextCorrectAnswers =
      fromType === TYPES.MCQ
        ? form.correctAnswer == null
          ? []
          : [form.correctAnswer]
        : Array.isArray(form.correctAnswers)
          ? form.correctAnswers
          : [];

    return {
      ...base,
      correctAnswers: [...new Set(nextCorrectAnswers)].filter(
        (index) => Number.isInteger(index) && index >= 0 && index < options.length
      ),
    };
  }

  const fallbackFromMulti =
    Array.isArray(form.correctAnswers) && form.correctAnswers.length > 0
      ? form.correctAnswers[0]
      : null;

  const nextCorrectAnswer =
    fromType === TYPES.MULTI_CORRECT ? fallbackFromMulti : form.correctAnswer ?? null;

  return {
    ...base,
    correctAnswer:
      Number.isInteger(nextCorrectAnswer) && nextCorrectAnswer < options.length
        ? nextCorrectAnswer
        : null,
  };
}

export const INIT = {
  view: "list",
  questions: [],
  filters: { type: "", difficulty: "", subject: "", search: "" },
  activeType: TYPES.MCQ,
  form: blank.mcq(),
  formsByType: createFormsByType(),
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
      {
        const nextFormsByType = {
          ...state.formsByType,
          [state.activeType]: cloneForm(state.form),
        };

        const switchingSingleAndMulti =
          (state.activeType === TYPES.MCQ && action.value === TYPES.MULTI_CORRECT) ||
          (state.activeType === TYPES.MULTI_CORRECT && action.value === TYPES.MCQ);

        const nextForm = switchingSingleAndMulti
          ? mapSingleAndMultiForm(state.activeType, action.value, state.form)
          : cloneForm(nextFormsByType[action.value] || blank[action.value]());

        nextFormsByType[action.value] = cloneForm(nextForm);

        return {
          ...state,
          activeType: action.value,
          form: nextForm,
          formsByType: nextFormsByType,
          errors: [],
        };
      }
    case "FORM":
      {
        const nextForm = { ...state.form, ...action.value };
        return {
          ...state,
          form: nextForm,
          formsByType: {
            ...state.formsByType,
            [state.activeType]: cloneForm(nextForm),
          },
        };
      }
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
      {
        const nextFormsByType = createFormsByType();
        nextFormsByType[action.questionType] = cloneForm(action.form);

        return {
          ...state,
          view: "create",
          editingId: action.id,
          activeType: action.questionType,
          form: action.form,
          formsByType: nextFormsByType,
          errors: [],
        };
      }
    case "EDIT_CLEAR":
      {
        const clearedForm = blank[state.activeType]();
        return {
          ...state,
          editingId: null,
          form: clearedForm,
          formsByType: {
            ...state.formsByType,
            [state.activeType]: cloneForm(clearedForm),
          },
          errors: [],
        };
      }
    default:
      return state;
  }
}
