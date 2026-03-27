import { useLayoutEffect, useMemo, useRef, useState } from "react";
import "katex/dist/katex.min.css";
import renderMathInElement from "katex/dist/contrib/auto-render";
import "../../../styles/question-cards.css";
import sequenceArrowIcon from "../../../assets/ui/down-arrow.png";
import sequenceArrowDarkIcon from "../../../assets/ui/down-arrow-dark.png";

import { pillStyle, TYPE_COLOR, TYPE_ICON, TYPE_LABEL, TYPES } from "../constants";
import { Btn } from "./common";

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleDeterministic(items, seedText) {
  const result = [...items];
  const random = mulberry32(hashString(seedText));

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

function optionLabel(index) {
  return String.fromCharCode(65 + index);
}

function MatchPairBoard({ question }) {
  const pairs = question.pairs || [];
  const rightOptions = useMemo(
    () =>
      pairs.map((pair, index) => ({
        pairIndex: index,
        right: pair.right || "",
      })),
    [pairs]
  );
  const shuffleSeed = useMemo(
    () =>
      `${question.id || "new"}-${pairs
        .map((pair) => `${pair.left || ""}|${pair.right || ""}`)
        .join("||")}`,
    [pairs, question.id]
  );
  const shuffledRightOptions = useMemo(
    () => shuffleDeterministic(rightOptions, shuffleSeed),
    [rightOptions, shuffleSeed]
  );
  const rightIndexByPair = useMemo(
    () => new Map(shuffledRightOptions.map((item, index) => [item.pairIndex, index])),
    [shuffledRightOptions]
  );

  const canvasRef = useRef(null);
  const leftColumnRef = useRef(null);
  const rightColumnRef = useRef(null);
  const leftRefs = useRef([]);
  const rightRefs = useRef([]);
  const [lines, setLines] = useState([]);
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });

  useLayoutEffect(() => {
    const updateLines = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      if (!canvasRect.width || !canvasRect.height) return;
      const nextCanvasWidth = Math.max(1, Math.round(canvasRect.width));
      const nextCanvasHeight = Math.max(1, Math.round(canvasRect.height));
      setCanvasSize((current) =>
        current.width === nextCanvasWidth && current.height === nextCanvasHeight
          ? current
          : { width: nextCanvasWidth, height: nextCanvasHeight }
      );

      const leftColumnRect = leftColumnRef.current?.getBoundingClientRect();
      const rightColumnRect = rightColumnRef.current?.getBoundingClientRect();
      if (!leftColumnRect || !rightColumnRect) return;

      const nextLines = [];

      for (let pairIndex = 0; pairIndex < pairs.length; pairIndex += 1) {
        const leftNode = leftRefs.current[pairIndex];
        const rightIndex = rightIndexByPair.get(pairIndex);
        const rightNode =
          typeof rightIndex === "number" ? rightRefs.current[rightIndex] : null;
        if (!leftNode || !rightNode) continue;

        const leftRect = leftNode.getBoundingClientRect();
        const rightRect = rightNode.getBoundingClientRect();

        const y1 = leftRect.top + leftRect.height / 2 - canvasRect.top;
        const y2 = rightRect.top + rightRect.height / 2 - canvasRect.top;
        const x1 = leftRect.right - canvasRect.left + 2;
        const x2 = rightRect.left - canvasRect.left - 6;
        const horizontalSpan = Math.max(42, x2 - x1);
        const curve = Math.max(24, Math.min(92, horizontalSpan * 0.48));
        const cx1 = x1 + curve;
        const cx2 = x2 - curve;

        nextLines.push({
          id: pairIndex,
          x1,
          y1,
          x2,
          y2,
          cx1,
          cx2,
        });
      }

      setLines(nextLines);
    };

    updateLines();
    const frame = requestAnimationFrame(updateLines);
    window.addEventListener("resize", updateLines);
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateLines())
        : null;

    if (resizeObserver) {
      if (canvasRef.current) resizeObserver.observe(canvasRef.current);
      if (leftColumnRef.current) resizeObserver.observe(leftColumnRef.current);
      if (rightColumnRef.current) resizeObserver.observe(rightColumnRef.current);
      leftRefs.current.forEach((node) => node && resizeObserver.observe(node));
      rightRefs.current.forEach((node) => node && resizeObserver.observe(node));
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateLines);
      resizeObserver?.disconnect();
    };
  }, [pairs, rightIndexByPair, shuffledRightOptions]);

  const markerId = `qb-match-arrow-${question.id || "new"}`;

  return (
    <div className="qb-match-board">
      <div className="qb-match-columns qb-match-columns-with-lines">
        <div className="qb-match-column" ref={leftColumnRef}>
          <div className="qb-match-column-title">Column A</div>
          {pairs.map((pair, index) => (
            <div
              key={`left-${index}`}
              ref={(node) => {
                leftRefs.current[index] = node;
              }}
              className="qb-match-cell qb-match-cell-left"
            >
              <span className="qb-match-cell-index">{index + 1}.</span>
              <HtmlContent html={pair.left || ""} />
            </div>
          ))}
        </div>

        <div className="qb-match-line-canvas" ref={canvasRef} aria-hidden="true">
          <svg
            className="qb-match-line-svg"
            viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
            preserveAspectRatio="none"
          >
            <defs>
              <marker
                id={markerId}
                markerWidth="7"
                markerHeight="7"
                refX="6.2"
                refY="3.5"
                orient="auto"
              >
                <path d="M0,0 L7,3.5 L0,7 z" className="qb-match-line-arrow" />
              </marker>
            </defs>
            {lines.map((line) => (
              <path
                key={line.id}
                className="qb-match-line-path"
                d={`M ${line.x1} ${line.y1} C ${line.cx1} ${line.y1}, ${line.cx2} ${line.y2}, ${line.x2} ${line.y2}`}
                markerEnd={`url(#${markerId})`}
              />
            ))}
          </svg>
        </div>

        <div className="qb-match-column" ref={rightColumnRef}>
          <div className="qb-match-column-title">Column B</div>
          {shuffledRightOptions.map((item, index) => (
            <div
              key={`right-${item.pairIndex}-${index}`}
              ref={(node) => {
                rightRefs.current[index] = node;
              }}
              className="qb-match-cell qb-match-cell-right"
            >
              <span className="qb-match-option-badge">{optionLabel(index)}</span>
              <HtmlContent html={item.right} />
            </div>
          ))}
        </div>
      </div>

      <div className="qb-match-answer-map">
        <span className="qb-match-answer-title">Correct Mapping</span>
        <div className="qb-match-answer-grid">
          {pairs.map((_, index) => (
            <div key={`map-${index}`} className="qb-match-answer-row">
              <span className="qb-match-answer-left">{index + 1}</span>
              <span className="qb-match-answer-arrow">&#8594;</span>
              <span className="qb-match-answer-right">
                {optionLabel(rightIndexByPair.get(index) ?? 0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HtmlContent({ html, className, style }) {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      // Manually set HTML so React doesn't fight KaTeX's DOM mutations during rendering
      containerRef.current.innerHTML = html || "";
      
      renderMathInElement(containerRef.current, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        throwOnError: false,
        errorColor: "#ef4444"
      });
    }
  }, [html]);

  const finalClass = ["ck-html-content", className].filter(Boolean).join(" ");
  return <div ref={containerRef} className={finalClass} style={style} />;
}

function renderOptionGrid(options, isCorrect, correctClass = "") {
  return (
    <div className="qb-option-grid">
      {(options || []).map((option, index) => {
        const highlighted = isCorrect(index);
        const className = ["qb-option-chip", highlighted && "is-correct", highlighted && correctClass]
          .filter(Boolean)
          .join(" ");

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

function renderQuestionBody(question, isDark = false) {
  if (question.type === TYPES.MCQ) {
    return renderOptionGrid(question.options, (index) => index === question.correctAnswer);
  }

  if (question.type === TYPES.TRUE_FALSE) {
    return (
      <span className="qb-true-false-answer">
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
    return renderOptionGrid(
      question.options,
      (index) => (question.correctAnswers || []).includes(index),
      "is-multi"
    );
  }

  if (question.type === TYPES.MATCH_PAIR) {
    return <MatchPairBoard question={question} />;
  }

  if (question.type === TYPES.ARRANGE_SEQUENCE) {
    const sequence = Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : question.options || [];
    const sequenceConnectorIcon = isDark ? sequenceArrowDarkIcon : sequenceArrowIcon;

    return (
      <div className="qb-sequence-list">
        {sequence.map((item, index) => (
          <div key={index} className="qb-sequence-step">
            <div className="qb-sequence-item">
              <span className="qb-sequence-index">{index + 1}</span>
              <HtmlContent html={item || ""} className="qb-sequence-text" />
            </div>
            {index < sequence.length - 1 && (
              <div className="qb-sequence-connector" aria-hidden="true">
                <img src={sequenceConnectorIcon} alt="" className="qb-sequence-connector-icon" />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (question.type === TYPES.COMPREHENSIVE) {
    return (
      <div className="qb-comprehensive-root">
        <div className="qb-comprehensive-passage">
          <HtmlContent html={question.question} className="qb-comprehensive-passage-text" />
        </div>
        {(question.subQuestions || []).map((item, index) => (
          <div
            key={index}
            className="qb-comprehensive-item"
            style={{ "--sub-type-color": TYPE_COLOR[item.type] }}
          >
            <div className="qb-comprehensive-item-meta">
              <span className="qb-comprehensive-item-type">{TYPE_LABEL[item.type]}</span>
              <span className="qb-comprehensive-item-points">{item.points} pt</span>
            </div>
            <div className="qb-comprehensive-item-question">
              <span>{index + 1}.</span>
              <HtmlContent html={item.question} style={{ flex: 1 }} />
            </div>
            {renderQuestionBody(item, isDark)}
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export function Card({ question, onEdit, onDelete, onPreview, isDark = false }) {
  const color = TYPE_COLOR[question.type];

  return (
    <article className="qb-card" style={{ "--type-color": color }}>
      <div className="qb-card-accent" />
      <div className="qb-card-header">
        <div className="qb-card-tags">
          <span className="qb-type-pill">
            <img
              src={TYPE_ICON[question.type]}
              alt={`${TYPE_LABEL[question.type]} icon`}
              className="qb-type-icon"
            />
            {TYPE_LABEL[question.type]}
          </span>
          <span className="qb-meta-pill">{question.difficulty}</span>
          <span className="qb-meta-pill">{question.subject}</span>
          <span className="qb-meta-pill">{question.points}pt</span>
        </div>
        <div className="qb-action-group">
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
        <HtmlContent html={question.question} className="qb-question-text" />
      )}

      {question.instruction && (
        <div className="qb-instruction-box">
          <div className="qb-instruction-title">INSTRUCTION</div>
          <HtmlContent html={question.instruction} className="qb-instruction-text" />
        </div>
      )}

      {renderQuestionBody(question, isDark)}

      <div className="qb-card-footer">
        #{question.id} {question.createdAt ? `- ${new Date(question.createdAt).toLocaleDateString()}` : ""}
      </div>
    </article>
  );
}

export function Preview({ question, onClose, isDark = false }) {
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
          <span style={{ color, fontWeight: 800, fontSize: 18, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <img
              src={TYPE_ICON[question.type]}
              alt={`${TYPE_LABEL[question.type]} icon`}
              style={{
                width: 22,
                height: 22,
                objectFit: "contain",
                filter: "var(--type-icon-filter, none)",
              }}
            />
            {TYPE_LABEL[question.type]}
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

        {question.instruction && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid var(--border-color)",
              background: "var(--surface-alt-bg)",
            }}
          >
            <div style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              INSTRUCTION
            </div>
            <HtmlContent
              html={question.instruction}
              style={{ color: "var(--text-primary)", fontSize: 14, lineHeight: 1.6 }}
            />
          </div>
        )}

        {renderQuestionBody(question, isDark)}

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
