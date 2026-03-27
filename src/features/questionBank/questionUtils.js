import { TYPES } from "./constants";

export function stripHtml(value = "") {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sumSubQuestionPoints(subQuestions = []) {
  return subQuestions.reduce(
    (total, item) => total + Math.max(1, Number(item.points) || 1),
    0
  );
}

export function createSubQuestion(type = TYPES.MCQ) {
  const base = {
    type,
    question: "",
    explanation: "",
    points: 1,
  };

  if (type === TYPES.MCQ) {
    return { ...base, options: ["", "", "", ""], correctAnswer: null };
  }

  if (type === TYPES.TRUE_FALSE) {
    return { ...base, correctAnswer: null };
  }

  if (type === TYPES.MULTI_CORRECT) {
    return { ...base, options: ["", "", "", ""], correctAnswers: [] };
  }

  if (type === TYPES.ARRANGE_SEQUENCE) {
    return { ...base, options: ["", "", "", ""] };
  }

  return {
    ...base,
    question: "Match the following:",
    pairs: [
      { left: "", right: "" },
      { left: "", right: "" },
      { left: "", right: "" },
    ],
  };
}

export const blank = {
  mcq: () => ({
    question: "",
    instruction: "",
    options: ["", "", "", ""],
    correctAnswer: null,
    explanation: "",
    points: 1,
  }),
  true_false: () => ({
    question: "",
    instruction: "",
    correctAnswer: null,
    explanation: "",
    points: 1,
  }),
  multi_correct: () => ({
    question: "",
    instruction: "",
    options: ["", "", "", ""],
    correctAnswers: [],
    explanation: "",
    points: 1,
  }),
  arrange_sequence: () => ({
    question: "",
    instruction: "",
    options: ["", "", "", ""],
    explanation: "",
    points: 1,
  }),
  match_pair: () => ({
    question: "Match the following:",
    instruction: "",
    pairs: [
      { left: "", right: "" },
      { left: "", right: "" },
      { left: "", right: "" },
    ],
    explanation: "",
    points: 1,
  }),
  comprehensive: () => ({
    question: "",
    instruction: "",
    explanation: "",
    subQuestions: [createSubQuestion()],
  }),
};

function buildSubQuestionPayload(item) {
  const base = {
    type: item.type,
    question: item.question,
    explanation: item.explanation || null,
    points: Math.max(1, Number(item.points) || 1),
    options: null,
    correctAnswer: null,
    pairs: null,
  };

  if (item.type === TYPES.MCQ) {
    return {
      ...base,
      options: (item.options || []).filter((option) => stripHtml(option)),
      correctAnswer: item.correctAnswer,
    };
  }

  if (item.type === TYPES.TRUE_FALSE) {
    return {
      ...base,
      correctAnswer: item.correctAnswer,
    };
  }

  if (item.type === TYPES.MULTI_CORRECT) {
    return {
      ...base,
      options: (item.options || []).filter((option) => stripHtml(option)),
      correctAnswer: item.correctAnswers || [],
    };
  }

  if (item.type === TYPES.ARRANGE_SEQUENCE) {
    const sequence = (item.options || []).filter((option) => stripHtml(option));
    return {
      ...base,
      options: sequence,
      correctAnswer: sequence,
    };
  }

  return {
    ...base,
    pairs: (item.pairs || []).filter(
      (pair) => stripHtml(pair.left) && stripHtml(pair.right)
    ),
  };
}

export function buildPayload(type, form, meta) {
  const base = {
    type,
    question: form.question,
    instruction: form.instruction || null,
    explanation: form.explanation || null,
    points: form.points || 1,
    difficulty: meta.difficulty,
    subject: meta.subject,
    tags: meta.tags || null,
    options: null,
    correctAnswer: null,
    pairs: null,
    subQuestions: null,
  };

  if (type === TYPES.MCQ) {
    return {
      ...base,
      options: form.options.filter((option) => stripHtml(option)),
      correctAnswer: form.correctAnswer,
    };
  }

  if (type === TYPES.TRUE_FALSE) {
    return {
      ...base,
      correctAnswer: form.correctAnswer,
    };
  }

  if (type === TYPES.MULTI_CORRECT) {
    return {
      ...base,
      options: form.options.filter((option) => stripHtml(option)),
      correctAnswer: form.correctAnswers,
    };
  }

  if (type === TYPES.ARRANGE_SEQUENCE) {
    const sequence = form.options.filter((option) => stripHtml(option));
    return {
      ...base,
      options: sequence,
      correctAnswer: sequence,
    };
  }

  if (type === TYPES.MATCH_PAIR) {
    return {
      ...base,
      pairs: form.pairs.filter(
        (pair) => stripHtml(pair.left) && stripHtml(pair.right)
      ),
    };
  }

  if (type === TYPES.COMPREHENSIVE) {
    return {
      ...base,
      points: sumSubQuestionPoints(form.subQuestions),
      subQuestions: (form.subQuestions || []).map(buildSubQuestionPayload),
    };
  }

  return base;
}

export function normaliseSubQuestion(item) {
  const next = {
    ...createSubQuestion(item.type || TYPES.MCQ),
    ...item,
    points: Math.max(1, Number(item.points) || 1),
  };

  if (next.type === TYPES.MULTI_CORRECT) {
    next.correctAnswers = Array.isArray(item.correctAnswer)
      ? item.correctAnswer
      : item.correctAnswers || [];
  }

  return next;
}

export function normalise(question) {
  const next = { ...question };

  if (next.type === TYPES.MULTI_CORRECT) {
    next.correctAnswers = Array.isArray(next.correctAnswer)
      ? next.correctAnswer
      : [];
  }

  if (next.type === TYPES.ARRANGE_SEQUENCE) {
    next.options = Array.isArray(next.correctAnswer)
      ? next.correctAnswer
      : next.options || [];
  }

  if (next.type === TYPES.COMPREHENSIVE) {
    next.subQuestions = Array.isArray(next.subQuestions)
      ? next.subQuestions.map(normaliseSubQuestion)
      : [];
    next.points = next.points || sumSubQuestionPoints(next.subQuestions);
  }

  return next;
}

export const validate = {
  mcq(form) {
    const errors = [];
    if (!stripHtml(form.question)) errors.push("Question required");
    if (form.options.filter((option) => stripHtml(option)).length < 2) {
      errors.push("At least 2 options required");
    }
    if (form.correctAnswer == null) errors.push("Select the correct answer");
    return errors;
  },
  true_false(form) {
    const errors = [];
    if (!stripHtml(form.question)) errors.push("Question required");
    if (form.correctAnswer == null) errors.push("Select True or False");
    return errors;
  },
  multi_correct(form) {
    const errors = [];
    if (!stripHtml(form.question)) errors.push("Question required");
    if (form.options.filter((option) => stripHtml(option)).length < 2) {
      errors.push("At least 2 options required");
    }
    if (!form.correctAnswers?.length) errors.push("Select at least 1 correct answer");
    return errors;
  },
  arrange_sequence(form) {
    const errors = [];
    if (!stripHtml(form.question)) errors.push("Question required");
    if (form.options.filter((option) => stripHtml(option)).length < 2) {
      errors.push("Enter at least 2 sequence items");
    }
    return errors;
  },
  match_pair(form) {
    const errors = [];
    if (!stripHtml(form.question)) errors.push("Question required");
    if (
      form.pairs.filter((pair) => stripHtml(pair.left) && stripHtml(pair.right)).length < 2
    ) {
      errors.push("Need at least 2 complete pairs");
    }
    return errors;
  },
  comprehensive(form) {
    const errors = [];

    if (!stripHtml(form.question)) errors.push("Statement / passage required");
    if (!form.subQuestions?.length) errors.push("Add at least 1 related question");

    (form.subQuestions || []).forEach((item, index) => {
      validate[item.type](item).forEach((error) => {
        errors.push(`Sub-question ${index + 1}: ${error}`);
      });
    });

    return errors;
  },
};

export function toEditableForm(question) {
  const pad = (values, size) => [
    ...(values || []),
    ...Array(Math.max(0, size - (values || []).length)).fill(""),
  ];

  return {
    question: question.question,
    instruction: question.instruction || "",
    explanation: question.explanation || "",
    points: question.points || 1,
    ...(question.type === TYPES.MCQ
      ? { options: pad(question.options, 4), correctAnswer: question.correctAnswer }
      : {}),
    ...(question.type === TYPES.TRUE_FALSE
      ? { correctAnswer: question.correctAnswer }
      : {}),
    ...(question.type === TYPES.MULTI_CORRECT
      ? {
          options: pad(question.options, 4),
          correctAnswers: question.correctAnswers || [],
        }
      : {}),
    ...(question.type === TYPES.ARRANGE_SEQUENCE
      ? {
          options: pad(
            Array.isArray(question.correctAnswer)
              ? question.correctAnswer
              : question.options,
            4
          ),
        }
      : {}),
    ...(question.type === TYPES.MATCH_PAIR
      ? {
          pairs: [
            ...(question.pairs || []),
            ...Array(Math.max(0, 3 - (question.pairs || []).length)).fill({
              left: "",
              right: "",
            }),
          ],
        }
      : {}),
    ...(question.type === TYPES.COMPREHENSIVE
      ? {
          subQuestions: (question.subQuestions || []).map(normaliseSubQuestion),
        }
      : {}),
  };
}
