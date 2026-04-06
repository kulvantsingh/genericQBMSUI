// Shared style utilities and helpers used across multiple form components

export const answerConfigHistoryActionsStyle = {
  position: "absolute",
  right: 0,
  top: -34,
  display: "flex",
  gap: 6,
};

export const addTextButtonStyle = (sizeOffset = 0) => ({
  alignSelf: "flex-start",
  padding: 0,
  border: "none",
  background: "transparent",
  color: "var(--brand-primary)",
  fontSize: 14 + sizeOffset,
  fontWeight: 700,
  cursor: "pointer",
  lineHeight: 1.4,
});

export const areStringArraysEqual = (left, right) =>
  left.length === right.length && left.every((item, index) => item === right[index]);

export const areNumberArraysEqual = (left, right) =>
  left.length === right.length && left.every((item, index) => item === right[index]);

import { TYPES } from "../../utils/constants";

export function mapSubQuestionSingleAndMulti(fromType, toType, item) {
  const options =
    Array.isArray(item.options) && item.options.length > 0
      ? [...item.options]
      : ["", "", "", ""];

  const base = {
    type: toType,
    question: item.question || "",
    explanation: item.explanation || "",
    points: Math.max(1, Number(item.points) || 1),
    options,
  };

  if (toType === TYPES.MULTI_CORRECT) {
    const nextCorrectAnswers =
      fromType === TYPES.MCQ
        ? item.correctAnswer == null
          ? []
          : [item.correctAnswer]
        : Array.isArray(item.correctAnswers)
          ? item.correctAnswers
          : [];

    return {
      ...base,
      correctAnswers: [...new Set(nextCorrectAnswers)].filter(
        (index) => Number.isInteger(index) && index >= 0 && index < options.length
      ),
    };
  }

  const fallbackFromMulti =
    Array.isArray(item.correctAnswers) && item.correctAnswers.length > 0
      ? item.correctAnswers[0]
      : null;

  const nextCorrectAnswer =
    fromType === TYPES.MULTI_CORRECT ? fallbackFromMulti : item.correctAnswer ?? null;

  return {
    ...base,
    correctAnswer:
      Number.isInteger(nextCorrectAnswer) && nextCorrectAnswer >= 0 && nextCorrectAnswer < options.length
        ? nextCorrectAnswer
        : null,
  };
}
