import "../../../../styles/question-cards.css";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocalization } from "../../contexts/localizationContext";
import { HtmlContent } from "./HtmlContent";
import { shuffleDeterministic, optionLabel } from "./viewHelpers";

export function MatchPairBoard({ question }) {
  const { t } = useLocalization();
  const pairs = question.pairs || [];
  const rightOptions = useMemo(
    () => pairs.map((pair, index) => ({ pairIndex: index, right: pair.right || "" })),
    [pairs]
  );
  const shuffleSeed = useMemo(
    () => `${question.id || "new"}-${pairs.map((pair) => `${pair.left || ""}|${pair.right || ""}`).join("||")}`,
    [pairs, question.id]
  );
  const shuffledRightOptions = useMemo(() => shuffleDeterministic(rightOptions, shuffleSeed), [rightOptions, shuffleSeed]);
  const rightIndexByPair = useMemo(() => new Map(shuffledRightOptions.map((item, index) => [item.pairIndex, index])), [shuffledRightOptions]);

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
        const rightNode = typeof rightIndex === "number" ? rightRefs.current[rightIndex] : null;
        if (!leftNode || !rightNode) continue;

        const leftRect = leftNode.getBoundingClientRect();
        const rightRect = rightNode.getBoundingClientRect();
        const y1 = leftRect.top + leftRect.height / 2 - canvasRect.top;
        const y2 = rightRect.top + rightRect.height / 2 - canvasRect.top;
        const x1 = leftRect.right - canvasRect.left + 2;
        const x2 = rightRect.left - canvasRect.left - 6;
        const horizontalSpan = Math.max(42, x2 - x1);
        const curve = Math.max(24, Math.min(92, horizontalSpan * 0.48));
        nextLines.push({ id: pairIndex, x1, y1, x2, y2, cx1: x1 + curve, cx2: x2 - curve });
      }
      setLines(nextLines);
    };

    updateLines();
    const frame = requestAnimationFrame(updateLines);
    window.addEventListener("resize", updateLines);
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => updateLines()) : null;
    if (resizeObserver) {
      if (canvasRef.current) resizeObserver.observe(canvasRef.current);
      if (leftColumnRef.current) resizeObserver.observe(leftColumnRef.current);
      if (rightColumnRef.current) resizeObserver.observe(rightColumnRef.current);
      leftRefs.current.forEach((node) => node && resizeObserver.observe(node));
      rightRefs.current.forEach((node) => node && resizeObserver.observe(node));
    }

    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", updateLines); resizeObserver?.disconnect(); };
  }, [pairs, rightIndexByPair, shuffledRightOptions]);

  const markerId = `qb-match-arrow-${question.id || "new"}`;

  return (
    <div className="qb-match-board">
      <div className="qb-match-columns qb-match-columns-with-lines">
        <div className="qb-match-column" ref={leftColumnRef}>
          <div className="qb-match-column-title">{t("Column A")}</div>
          {pairs.map((pair, index) => (
            <div key={`left-${index}`} ref={(node) => { leftRefs.current[index] = node; }} className="qb-match-cell qb-match-cell-left">
              <span className="qb-match-cell-index">{index + 1}.</span>
              <HtmlContent html={pair.left || ""} />
            </div>
          ))}
        </div>

        <div className="qb-match-line-canvas" ref={canvasRef} aria-hidden="true">
          <svg className="qb-match-line-svg" viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`} preserveAspectRatio="none">
            <defs>
              <marker id={markerId} markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" className="qb-match-line-arrow" />
              </marker>
            </defs>
            {lines.map((line) => (
              <path key={line.id} className="qb-match-line-path" d={`M ${line.x1} ${line.y1} C ${line.cx1} ${line.y1}, ${line.cx2} ${line.y2}, ${line.x2} ${line.y2}`} markerEnd={`url(#${markerId})`} />
            ))}
          </svg>
        </div>

        <div className="qb-match-column" ref={rightColumnRef}>
          <div className="qb-match-column-title">{t("Column B")}</div>
          {shuffledRightOptions.map((item, index) => (
            <div key={`right-${item.pairIndex}-${index}`} ref={(node) => { rightRefs.current[index] = node; }} className="qb-match-cell qb-match-cell-right">
              <span className="qb-match-option-badge">{optionLabel(index)}</span>
              <HtmlContent html={item.right} />
            </div>
          ))}
        </div>
      </div>

      <div className="qb-match-answer-map">
        <span className="qb-match-answer-title">{t("Correct Mapping")}</span>
        <div className="qb-match-answer-grid">
          {pairs.map((_, index) => (
            <div key={`map-${index}`} className="qb-match-answer-row">
              <span className="qb-match-answer-left">{index + 1}</span>
              <span className="qb-match-answer-arrow">&#8594;</span>
              <span className="qb-match-answer-right">{optionLabel(rightIndexByPair.get(index) ?? 0)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
