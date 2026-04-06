import { TYPES } from "../../utils/constants";
import { MCQForm } from "./MCQForm";
import { TrueFalseForm } from "./TrueFalseForm";
import { MultiCorrectForm } from "./MultiCorrectForm";
import { ArrangeSequenceForm } from "./ArrangeSequenceForm";
import { MatchPairForm } from "./MatchPairForm";

export function AnswerConfiguration({ type, form, onPatch, isDark = false, sizeOffset = 0 }) {
  if (type === TYPES.MCQ) {
    return <MCQForm form={form} onPatch={onPatch} isDark={isDark} sizeOffset={sizeOffset} />;
  }
  if (type === TYPES.TRUE_FALSE) {
    return <TrueFalseForm form={form} onPatch={onPatch} isDark={isDark} sizeOffset={sizeOffset} />;
  }
  if (type === TYPES.MULTI_CORRECT) {
    return <MultiCorrectForm form={form} onPatch={onPatch} isDark={isDark} sizeOffset={sizeOffset} />;
  }
  if (type === TYPES.ARRANGE_SEQUENCE) {
    return <ArrangeSequenceForm form={form} onPatch={onPatch} isDark={isDark} sizeOffset={sizeOffset} />;
  }
  if (type === TYPES.MATCH_PAIR) {
    return <MatchPairForm form={form} onPatch={onPatch} isDark={isDark} sizeOffset={sizeOffset} />;
  }
  return null;
}
