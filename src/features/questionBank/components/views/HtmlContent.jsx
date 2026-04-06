import { useLayoutEffect, useRef } from "react";
import "katex/dist/katex.min.css";
import renderMathInElement from "katex/dist/contrib/auto-render";

export function HtmlContent({ html, className, style }) {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = html || "";
      renderMathInElement(containerRef.current, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
        throwOnError: false,
        errorColor: "#ef4444",
      });
    }
  }, [html]);

  const finalClass = ["ck-html-content", className].filter(Boolean).join(" ");
  return <div ref={containerRef} className={finalClass} style={style} />;
}
