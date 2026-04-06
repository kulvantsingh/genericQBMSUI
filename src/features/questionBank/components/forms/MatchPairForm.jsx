import { useEffect, useRef, useState } from "react";
import crossIcon from "../../../../assets/ui/cross.png";
import twoSidedArrowIcon from "../../../../assets/ui/transfer.png";
import { removeButtonStyle } from "../../utils/constants";
import { useLocalization } from "../../contexts/localizationContext";
import { Field } from "../controls/Field";
import { UndoIconButton, RedoIconButton } from "./UndoRedoButtons";
import { answerConfigHistoryActionsStyle, addTextButtonStyle, areStringArraysEqual } from "./formHelpers";

export function MatchPairForm({ form, onPatch, isDark = false, sizeOffset = 0 }) {
  const { t } = useLocalization();
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const didLocalPatchRef = useRef(false);
  const nextPairIdRef = useRef(1);
  const [pairIds, setPairIds] = useState(() => form.pairs.map(() => `pair-${nextPairIdRef.current++}`));

  useEffect(() => {
    setPairIds((previous) => {
      if (previous.length === form.pairs.length) return previous;
      if (previous.length > form.pairs.length) return previous.slice(0, form.pairs.length);
      const additions = Array.from({ length: form.pairs.length - previous.length }, () => `pair-${nextPairIdRef.current++}`);
      return [...previous, ...additions];
    });
  }, [form.pairs.length]);

  const clonePairs = (pairs) => pairs.map((pair) => ({ left: pair.left ?? "", right: pair.right ?? "" }));
  const arePairsEqual = (leftPairs, rightPairs) => {
    if (leftPairs.length !== rightPairs.length) return false;
    return leftPairs.every((pair, index) => (pair.left ?? "") === (rightPairs[index]?.left ?? "") && (pair.right ?? "") === (rightPairs[index]?.right ?? ""));
  };

  useEffect(() => {
    if (!didLocalPatchRef.current) { setHistory([]); setFuture([]); }
    didLocalPatchRef.current = false;
  }, [form.pairs]);

  const patchPairs = (nextPairs, nextIds = pairIds) => {
    if (arePairsEqual(form.pairs, nextPairs) && areStringArraysEqual(nextIds, pairIds)) return;
    setHistory((previous) => [...previous.slice(-59), { pairs: clonePairs(form.pairs), pairIds: [...pairIds] }]);
    setFuture([]);
    didLocalPatchRef.current = true;
    setPairIds(nextIds);
    onPatch({ pairs: nextPairs });
  };

  const setPair = (index, side, value) => patchPairs(form.pairs.map((pair, i) => i === index ? { ...pair, [side]: value } : pair));
  const removePair = (index) => { const nextIds = pairIds.filter((_, i) => i !== index); patchPairs(form.pairs.filter((_, i) => i !== index), nextIds); };
  const addPair = () => { const nextIds = [...pairIds, `pair-${nextPairIdRef.current++}`]; patchPairs([...form.pairs, { left: "", right: "" }], nextIds); };

  const undoPairEdit = () => {
    setHistory((previous) => {
      if (previous.length === 0) return previous;
      const nextHistory = [...previous];
      const snap = nextHistory.pop();
      if (snap) {
        setFuture((upcoming) => [...upcoming.slice(-59), { pairs: clonePairs(form.pairs), pairIds: [...pairIds] }]);
        didLocalPatchRef.current = true;
        setPairIds(snap.pairIds || pairIds);
        onPatch({ pairs: snap.pairs || [] });
      }
      return nextHistory;
    });
  };

  const redoPairEdit = () => {
    setFuture((previous) => {
      if (previous.length === 0) return previous;
      const nextFuture = [...previous];
      const snap = nextFuture.pop();
      if (snap) {
        setHistory((past) => [...past.slice(-59), { pairs: clonePairs(form.pairs), pairIds: [...pairIds] }]);
        didLocalPatchRef.current = true;
        setPairIds(snap.pairIds || pairIds);
        onPatch({ pairs: snap.pairs || [] });
      }
      return nextFuture;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
      <div style={answerConfigHistoryActionsStyle}>
        <UndoIconButton onClick={undoPairEdit} disabled={history.length === 0} isDark={isDark} />
        <RedoIconButton onClick={redoPairEdit} disabled={future.length === 0} isDark={isDark} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto", gap: 10 }}>
        <span style={{ color: "var(--brand-accent)", fontWeight: 700, fontSize: 13 + sizeOffset, textAlign: "center" }}>{t("Column A")}</span>
        <span />
        <span style={{ color: "var(--brand-secondary)", fontWeight: 700, fontSize: 13 + sizeOffset, textAlign: "center" }}>{t("Column B")}</span>
        <span />
      </div>
      {form.pairs.map((pair, index) => (
        <div key={pairIds[index] || `pair-fallback-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto", gap: 10, alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <Field value={pair.left} onChange={(event) => setPair(index, "left", event.target.value)} placeholder={`${t("Column A")} ${index + 1}`} sizeOffset={sizeOffset} />
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: 18 }}>
            <img src={twoSidedArrowIcon} alt={t("Remove pair")} aria-hidden="true" style={{ width: 16, height: 16, objectFit: "contain" }} />
          </span>
          <div style={{ minWidth: 0 }}>
            <Field value={pair.right} onChange={(event) => setPair(index, "right", event.target.value)} placeholder={`${t("Column B")} ${index + 1}`} sizeOffset={sizeOffset} />
          </div>
          {form.pairs.length > 2 ? (
            <button type="button" onClick={() => removePair(index)} style={removeButtonStyle}>
              <img src={crossIcon} alt={t("Remove pair")} aria-hidden="true" style={{ width: 16, height: 16, objectFit: "contain" }} />
            </button>
          ) : <span />}
        </div>
      ))}
      {form.pairs.length < 10 && (
        <button type="button" onClick={addPair} style={addTextButtonStyle(sizeOffset)}>{t("+ Add Pair")}</button>
      )}
    </div>
  );
}
