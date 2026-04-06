import { pillStyle, TYPE_COLOR, TYPE_ICON, TYPE_LABEL, TYPES } from "../../utils/constants";
import { useLocalization } from "../../contexts/localizationContext";
import sequenceArrowIcon from "../../../../assets/ui/down-arrow.png";
import sequenceArrowDarkIcon from "../../../../assets/ui/down-arrow-dark.png";
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

export function Preview({ question, onClose, isDark = false }) {
  const { t } = useLocalization();
  const color = TYPE_COLOR[question.type];

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div style={{ background: "var(--surface-bg)", borderRadius: 20, padding: 32, maxWidth: 760, width: "100%", border: `1px solid ${color}44`, boxShadow: `0 0 60px ${color}22`, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ color, fontWeight: 800, fontSize: 18, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <img src={TYPE_ICON[question.type]} alt={`${TYPE_LABEL[question.type]} icon`} style={{ width: 22, height: 22, objectFit: "contain", filter: "var(--type-icon-filter, none)" }} />
            {t(TYPE_LABEL[question.type])}
          </span>
          <button onClick={onClose} style={{ background: "var(--pill-bg)", border: "none", color: "var(--text-secondary)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 700 }}>{t("Close")}</button>
        </div>

        {question.instruction && (
          <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, border: "1px solid var(--border-color)", background: "var(--surface-alt-bg)" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t("INSTRUCTION")}</div>
            <HtmlContent html={question.instruction} style={{ color: "var(--text-primary)", fontSize: 14, lineHeight: 1.6 }} />
          </div>
        )}

        {question.type !== TYPES.COMPREHENSIVE && (
          <HtmlContent html={question.question} style={{ color: "var(--text-primary)", fontSize: 17, lineHeight: 1.7, marginBottom: 20 }} />
        )}

        {renderQuestionBody(question, isDark, t)}

        <MetadataPanel question={question} />

        {question.explanation && (
          <div style={{ marginTop: 20, padding: "14px 18px", background: "var(--surface-alt-bg)", borderRadius: 12, borderLeft: "3px solid var(--text-secondary)" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 700 }}>{t("EXPLANATION")}{" "}</span>
            <HtmlContent html={question.explanation} style={{ color: "var(--text-soft)", fontSize: 14, marginTop: 6 }} />
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[t(question.difficulty), t(question.subject), `${question.points} ${t(question.points !== 1 ? "points" : "point")}`].map((item) => (
            <span key={item} style={pillStyle}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
