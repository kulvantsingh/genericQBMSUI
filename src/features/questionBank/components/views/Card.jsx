import "../../../../styles/question-cards.css";
import { TYPE_COLOR, TYPE_ICON, TYPE_LABEL, TYPES } from "../../utils/constants";
import { useLocalization } from "../../contexts/localizationContext";
import sequenceArrowIcon from "../../../../assets/ui/down-arrow.png";
import sequenceArrowDarkIcon from "../../../../assets/ui/down-arrow-dark.png";
import { Btn } from "../controls/Btn";
import { HtmlContent } from "./HtmlContent";
import { MetadataPanel } from "./MetadataPanel";
import { MatchPairBoard } from "./MatchPairBoard";

function renderOptionGrid(options, isCorrect, correctClass = "") {
  return (
    <div className="qb-option-grid">
      {(options || []).map((option, index) => {
        const highlighted = isCorrect(index);
        const className = ["qb-option-chip", highlighted && "is-correct", highlighted && correctClass].filter(Boolean).join(" ");
        return (
          <div key={index} className={className}>
            <span className="qb-option-label">{String.fromCharCode(65 + index)}.</span>
            <HtmlContent html={option || ""} className="qb-option-value" />
          </div>
        );
      })}
    </div>
  );
}

function renderQuestionBody(question, isDark = false, t = (v) => v) {
  if (question.type === TYPES.MCQ) return renderOptionGrid(question.options, (index) => index === question.correctAnswer);
  if (question.type === TYPES.TRUE_FALSE) return (<span className="qb-true-false-answer">{t("Answer:")}{" "}{question.correctAnswer === true ? t("True") : question.correctAnswer === false ? t("False") : "-"}</span>);
  if (question.type === TYPES.MULTI_CORRECT) return renderOptionGrid(question.options, (index) => (question.correctAnswers || []).includes(index), "is-multi");
  if (question.type === TYPES.MATCH_PAIR) return <MatchPairBoard question={question} />;
  if (question.type === TYPES.ARRANGE_SEQUENCE) {
    const sequence = Array.isArray(question.correctAnswer) ? question.correctAnswer : question.options || [];
    const icon = isDark ? sequenceArrowDarkIcon : sequenceArrowIcon;
    return (
      <div className="qb-sequence-list">
        {sequence.map((item, index) => (
          <div key={index} className="qb-sequence-step">
            <div className="qb-sequence-item"><span className="qb-sequence-index">{index + 1}</span><HtmlContent html={item || ""} className="qb-sequence-text" /></div>
            {index < sequence.length - 1 && <div className="qb-sequence-connector" aria-hidden="true"><img src={icon} alt="" className="qb-sequence-connector-icon" /></div>}
          </div>
        ))}
      </div>
    );
  }
  if (question.type === TYPES.COMPREHENSIVE) {
    return (
      <div className="qb-comprehensive-root">
        <div className="qb-comprehensive-passage"><HtmlContent html={question.question} className="qb-comprehensive-passage-text" /></div>
        {(question.subQuestions || []).map((item, index) => (
          <div key={index} className="qb-comprehensive-item" style={{ "--sub-type-color": TYPE_COLOR[item.type] }}>
            <div className="qb-comprehensive-item-meta">
              <span className="qb-comprehensive-item-type">{t(TYPE_LABEL[item.type])}</span>
              <span className="qb-comprehensive-item-points">{item.points} {t(item.points !== 1 ? "points" : "point")}</span>
            </div>
            <div className="qb-comprehensive-item-question"><span>{index + 1}.</span><HtmlContent html={item.question} style={{ flex: 1 }} /></div>
            {renderQuestionBody(item, isDark, t)}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function Card({ question, onEdit, onDelete, onPreview, isDark = false }) {
  const { t } = useLocalization();
  const color = TYPE_COLOR[question.type];

  return (
    <article className="qb-card" style={{ "--type-color": color }}>
      <div className="qb-card-accent" />
      <div className="qb-card-header">
        <div className="qb-card-tags">
          <span className="qb-type-pill">
            <img src={TYPE_ICON[question.type]} alt={`${TYPE_LABEL[question.type]} icon`} className="qb-type-icon" />
            {t(TYPE_LABEL[question.type])}
          </span>
          <span className="qb-meta-pill">{t(question.difficulty)}</span>
          <span className="qb-meta-pill">{t(question.subject)}</span>
          <span className="qb-meta-pill">{question.points} {t(question.points !== 1 ? "points" : "point")}</span>
        </div>
        <div className="qb-action-group">
          <Btn small ghost onClick={() => onPreview(question)}>{t("View")}</Btn>
          <Btn small ghost onClick={() => onEdit(question)}>{t("Edit")}</Btn>
          <Btn small danger onClick={() => onDelete(question.id)}>{t("Delete")}</Btn>
        </div>
      </div>
      {question.instruction && (<div className="qb-instruction-box"><HtmlContent html={question.instruction} className="qb-instruction-text" /></div>)}
      {question.type !== TYPES.COMPREHENSIVE && (<HtmlContent html={question.question} className="qb-question-text" />)}
      {renderQuestionBody(question, isDark, t)}
      <MetadataPanel question={question} compact />
      <div className="qb-card-footer">#{question.id} {question.createdAt ? `- ${new Date(question.createdAt).toLocaleDateString()}` : ""}</div>
    </article>
  );
}
