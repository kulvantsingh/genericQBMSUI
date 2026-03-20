import { pillStyle, TYPE_COLOR, TYPE_ICON, TYPE_LABEL, TYPES } from "../constants";
import { Btn } from "./common";

function HtmlContent({ html, style }) {
  return <div style={style} dangerouslySetInnerHTML={{ __html: html || "" }} />;
}

function renderQuestionBody(question) {
  if (question.type === TYPES.MCQ) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {(question.options || []).map((option, index) => (
          <span
            key={index}
            style={{
              padding: "3px 12px",
              borderRadius: 8,
              fontSize: 13,
              background: index === question.correctAnswer ? "#00e5a022" : "var(--pill-bg)",
              color: index === question.correctAnswer ? "#00e5a0" : "var(--text-secondary)",
              border:
                index === question.correctAnswer
                  ? "1px solid #00e5a033"
                  : "1px solid transparent",
            }}
          >
            <span style={{ fontWeight: 700, marginRight: 6 }}>
              {String.fromCharCode(65 + index)}.
            </span>
            <span dangerouslySetInnerHTML={{ __html: option || "" }} />
          </span>
        ))}
      </div>
    );
  }

  if (question.type === TYPES.TRUE_FALSE) {
    return (
      <span style={{ color: "#00e5a0", fontSize: 13, fontWeight: 700 }}>
        Answer:{" "}
        {question.correctAnswer === true
          ? "True"
          : question.correctAnswer === false
            ? "False"
            : "-"}
      </span>
    );
  }

  if (question.type === TYPES.MULTI_CORRECT) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {(question.options || []).map((option, index) => (
          <span
            key={index}
            style={{
              padding: "3px 12px",
              borderRadius: 8,
              fontSize: 13,
              background: (question.correctAnswers || []).includes(index)
                ? "#ff9f4322"
                : "var(--pill-bg)",
              color: (question.correctAnswers || []).includes(index)
                ? "#ff9f43"
                : "var(--text-secondary)",
              border: (question.correctAnswers || []).includes(index)
                ? "1px solid #ff9f4333"
                : "1px solid transparent",
            }}
          >
            <span style={{ fontWeight: 700, marginRight: 6 }}>
              {String.fromCharCode(65 + index)}.
            </span>
            <span dangerouslySetInnerHTML={{ __html: option || "" }} />
          </span>
        ))}
      </div>
    );
  }

  if (question.type === TYPES.MATCH_PAIR) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {(question.pairs || []).map((pair, index) => (
          <div key={index} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            <span style={{ color: "#ff6b9d", background: "#ff6b9d22", padding: "2px 10px", borderRadius: 6 }}>
              <span dangerouslySetInnerHTML={{ __html: pair.left || "" }} />
            </span>
            <span style={{ color: "var(--text-secondary)" }}>=</span>
            <span style={{ color: "#7c6aff", background: "#7c6aff22", padding: "2px 10px", borderRadius: 6 }}>
              <span dangerouslySetInnerHTML={{ __html: pair.right || "" }} />
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (question.type === TYPES.ARRANGE_SEQUENCE) {
    const sequence = Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : question.options || [];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sequence.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              padding: "10px 12px",
              borderRadius: 10,
              background: "#ffd16612",
              border: "1px solid #ffd16633",
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                background: "#ffd16622",
                color: "#ffd166",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                flexShrink: 0,
                fontSize: 12,
              }}
            >
              {index + 1}
            </span>
            <span style={{ color: "var(--text-primary)", flex: 1 }} dangerouslySetInnerHTML={{ __html: item || "" }} />
          </div>
        ))}
      </div>
    );
  }

  if (question.type === TYPES.COMPREHENSIVE) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 12,
            background: "var(--surface-alt-bg)",
            border: "1px solid var(--border-color)",
            color: "var(--text-primary)",
            lineHeight: 1.7,
          }}
        >
          <HtmlContent html={question.question} />
        </div>
        {(question.subQuestions || []).map((item, index) => (
          <div
            key={index}
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid var(--border-color)",
              background: "var(--surface-alt-bg)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
              <span style={{ color: TYPE_COLOR[item.type], fontSize: 12, fontWeight: 700 }}>
                {TYPE_LABEL[item.type]}
              </span>
              <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{item.points} pt</span>
            </div>
            <div style={{ color: "var(--text-primary)", marginBottom: 10, display: "flex", gap: 6 }}>
              <span>{index + 1}.</span>
              <HtmlContent html={item.question} style={{ flex: 1 }} />
            </div>
            {renderQuestionBody(item)}
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export function Card({ question, onEdit, onDelete, onPreview }) {
  const color = TYPE_COLOR[question.type];

  return (
    <div
      style={{
        background: "var(--surface-bg)",
        borderRadius: 16,
        border: "1px solid var(--border-color)",
        padding: "20px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: color }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ background: `${color}22`, color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            {TYPE_ICON[question.type]} {TYPE_LABEL[question.type]}
          </span>
          <span style={pillStyle}>{question.difficulty}</span>
          <span style={pillStyle}>{question.subject}</span>
          <span style={pillStyle}>{question.points}pt</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Btn small ghost onClick={() => onPreview(question)}>
            View
          </Btn>
          <Btn small ghost onClick={() => onEdit(question)}>
            Edit
          </Btn>
          <Btn small danger onClick={() => onDelete(question.id)}>
            Delete
          </Btn>
        </div>
      </div>

      {question.type !== TYPES.COMPREHENSIVE && (
        <HtmlContent
          html={question.question}
          style={{ color: "var(--text-primary)", fontSize: 15, lineHeight: 1.6, margin: "0 0 10px" }}
        />
      )}

      {renderQuestionBody(question)}

      <div style={{ marginTop: 10, color: "var(--text-muted)", fontSize: 12 }}>
        #{question.id} {question.createdAt ? `- ${new Date(question.createdAt).toLocaleDateString()}` : ""}
      </div>
    </div>
  );
}

export function Preview({ question, onClose }) {
  const color = TYPE_COLOR[question.type];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000000cc",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--surface-bg)",
          borderRadius: 20,
          padding: 32,
          maxWidth: 760,
          width: "100%",
          border: `1px solid ${color}44`,
          boxShadow: `0 0 60px ${color}22`,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ color, fontWeight: 800, fontSize: 18 }}>
            {TYPE_ICON[question.type]} {TYPE_LABEL[question.type]}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "var(--pill-bg)",
              border: "none",
              color: "var(--text-secondary)",
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Close
          </button>
        </div>

        {question.type !== TYPES.COMPREHENSIVE && (
          <HtmlContent
            html={question.question}
            style={{ color: "var(--text-primary)", fontSize: 17, lineHeight: 1.7, marginBottom: 20 }}
          />
        )}

        {renderQuestionBody(question)}

        {question.explanation && (
          <div
            style={{
              marginTop: 20,
              padding: "14px 18px",
              background: "var(--surface-alt-bg)",
              borderRadius: 12,
              borderLeft: "3px solid var(--text-secondary)",
            }}
          >
            <span style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 700 }}>
              EXPLANATION{" "}
            </span>
            <HtmlContent
              html={question.explanation}
              style={{ color: "var(--text-soft)", fontSize: 14, marginTop: 6 }}
            />
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[question.difficulty, question.subject, `${question.points} point${question.points !== 1 ? "s" : ""}`].map((item) => (
            <span key={item} style={pillStyle}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
