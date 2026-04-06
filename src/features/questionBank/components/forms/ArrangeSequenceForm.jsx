import { useEffect, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import sequenceArrowIcon from "../../../../assets/ui/down-arrow.png";
import sequenceArrowDarkIcon from "../../../../assets/ui/down-arrow-dark.png";
import crossIcon from "../../../../assets/ui/cross.png";
import { removeButtonStyle } from "../../utils/constants";
import { useLocalization } from "../../contexts/localizationContext";
import { Field } from "../controls/Field";
import { UndoIconButton, RedoIconButton } from "./UndoRedoButtons";
import { answerConfigHistoryActionsStyle, addTextButtonStyle, areStringArraysEqual, areNumberArraysEqual } from "./formHelpers";

function SequenceSortableRow({ id, index, option, optionsLength, setItem, removeItem, showDropHighlight, sizeOffset = 0 }) {
  const { t } = useLocalization();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        display: "flex", gap: 10, alignItems: "center", borderRadius: 10, padding: "4px 2px",
        transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.68 : 1,
        border: showDropHighlight ? "1px dashed color-mix(in srgb, var(--sequence-accent) 58%, transparent)" : "1px dashed transparent",
        background: showDropHighlight ? "color-mix(in srgb, var(--sequence-accent) 10%, transparent)" : "transparent",
      }}
    >
      <button type="button" title={t("Drag to reorder")} aria-label={`${t("Drag sequence item")} ${index + 1}`} {...attributes} {...listeners}
        style={{ width: 24, border: "none", background: "transparent", color: "var(--text-muted)", cursor: "grab", fontSize: 13 + sizeOffset, lineHeight: 1, userSelect: "none", letterSpacing: 1, padding: 0, flexShrink: 0 }}
      >
        ||
      </button>
      <div style={{ width: 28, height: 28, borderRadius: 999, background: "color-mix(in srgb, var(--sequence-accent) 22%, transparent)", color: "var(--sequence-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
        {index + 1}
      </div>
      <div style={{ flex: 1 }}>
        <Field value={option} onChange={(event) => setItem(index, event.target.value)} placeholder={`${t("Sequence item")} ${index + 1}`} sizeOffset={sizeOffset} />
      </div>
      {optionsLength > 2 && (
        <button type="button" onClick={() => removeItem(index)} style={removeButtonStyle}>
          <img src={crossIcon} alt={t("Remove item")} aria-hidden="true" style={{ width: 16, height: 16, objectFit: "contain" }} />
        </button>
      )}
    </div>
  );
}

export function ArrangeSequenceForm({ form, onPatch, isDark = false, sizeOffset = 0 }) {
  const { t } = useLocalization();
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const didLocalPatchRef = useRef(false);
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [itemIds, setItemIds] = useState(() => form.options.map((_, index) => index + 1));
  const nextIdRef = useRef(form.options.length + 1);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    setItemIds((previous) => {
      if (previous.length === form.options.length) return previous;
      if (previous.length < form.options.length) {
        const additions = Array.from({ length: form.options.length - previous.length }, () => { const id = nextIdRef.current; nextIdRef.current += 1; return id; });
        return [...previous, ...additions];
      }
      return previous.slice(0, form.options.length);
    });
  }, [form.options.length]);

  useEffect(() => {
    if (!didLocalPatchRef.current) { setHistory([]); setFuture([]); }
    didLocalPatchRef.current = false;
  }, [form.options]);

  const patchSequence = (nextOptions, nextIds = itemIds) => {
    if (areStringArraysEqual(nextOptions, form.options) && areNumberArraysEqual(nextIds, itemIds)) return;
    setHistory((previous) => [...previous.slice(-59), { options: [...form.options], itemIds: [...itemIds] }]);
    setFuture([]);
    didLocalPatchRef.current = true;
    setItemIds(nextIds);
    onPatch({ options: nextOptions });
  };

  const undo = () => {
    setHistory((previous) => {
      if (previous.length === 0) return previous;
      const nextHistory = [...previous];
      const snapshot = nextHistory.pop();
      if (snapshot) {
        setFuture((upcoming) => [...upcoming.slice(-59), { options: [...form.options], itemIds: [...itemIds] }]);
        didLocalPatchRef.current = true;
        setItemIds(snapshot.itemIds || itemIds);
        onPatch({ options: snapshot.options || [] });
      }
      return nextHistory;
    });
  };

  const redo = () => {
    setFuture((previous) => {
      if (previous.length === 0) return previous;
      const nextFuture = [...previous];
      const snapshot = nextFuture.pop();
      if (snapshot) {
        setHistory((past) => [...past.slice(-59), { options: [...form.options], itemIds: [...itemIds] }]);
        didLocalPatchRef.current = true;
        setItemIds(snapshot.itemIds || itemIds);
        onPatch({ options: snapshot.options || [] });
      }
      return nextFuture;
    });
  };

  const setItem = (index, value) => { const options = [...form.options]; options[index] = value; patchSequence(options); };
  const removeItem = (index) => { const nextIds = itemIds.filter((_, i) => i !== index); patchSequence(form.options.filter((_, i) => i !== index), nextIds); };
  const addItem = () => { const id = nextIdRef.current; nextIdRef.current += 1; patchSequence([...form.options, ""], [...itemIds, id]); };

  const sequenceConnectorIcon = isDark ? sequenceArrowDarkIcon : sequenceArrowIcon;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative" }}>
      <div style={answerConfigHistoryActionsStyle}>
        <UndoIconButton onClick={undo} disabled={history.length === 0} isDark={isDark} />
        <RedoIconButton onClick={redo} disabled={future.length === 0} isDark={isDark} />
      </div>
      <p style={{ color: "var(--text-secondary)", fontSize: 13 + sizeOffset, margin: 0 }}>
        {t("Enter the sequence items in the correct order. Students will arrange them in this order.")}
      </p>
      <div style={{ color: "var(--text-muted)", fontSize: 12 + sizeOffset, marginTop: -4 }}>{t("Drag and drop to reorder items")}</div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => { setActiveId(e.active.id); setOverId(e.active.id); }} onDragOver={(e) => setOverId(e.over?.id ?? null)} onDragEnd={(e) => { const { active, over } = e; if (over && active.id !== over.id) { const fi = itemIds.indexOf(active.id); const ti = itemIds.indexOf(over.id); if (fi !== -1 && ti !== -1) patchSequence(arrayMove(form.options, fi, ti), arrayMove(itemIds, fi, ti)); } setActiveId(null); setOverId(null); }} onDragCancel={() => { setActiveId(null); setOverId(null); }}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {form.options.map((option, index) => (
            <div key={itemIds[index]}>
              <SequenceSortableRow id={itemIds[index]} index={index} option={option} optionsLength={form.options.length} setItem={setItem} removeItem={removeItem} sizeOffset={sizeOffset} showDropHighlight={overId === itemIds[index] && activeId !== null && activeId !== itemIds[index]} />
              {index < form.options.length - 1 && (
                <div style={{ display: "flex", justifyContent: "center", opacity: 0.8, marginTop: 2 }}>
                  <img src={sequenceConnectorIcon} alt="" aria-hidden="true" style={{ width: 16, height: 16, objectFit: "contain" }} />
                </div>
              )}
            </div>
          ))}
        </SortableContext>
      </DndContext>
      {form.options.length < 8 && (
        <button type="button" onClick={addItem} style={addTextButtonStyle(sizeOffset)}>{t("+ Add Item")}</button>
      )}
    </div>
  );
}
