// Glyph grid for the active alphabet; click a glyph to assign the selected phoneme(s).
// Glyphs can be reordered by dragging — drop between cards to insert at that position.

import { useRef, useState } from "react";
import GlyphRenderer from "../shared/GlyphRenderer";

export default function MappingPanel({ glyphs, alphabetId, selectedGlyphId, onSelectGlyph, onReorderGlyphs, glyphSize = 72 }) {
  const dragSrcId = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  // { id: string, before: bool } — which card is being hovered and which half
  const [dropTarget, setDropTarget] = useState(null);

  function handleDragStart(glyphId) {
    dragSrcId.current = glyphId;
    setDraggingId(glyphId);
  }

  function handleDragOver(e, glyphId) {
    e.preventDefault();
    if (!dragSrcId.current || dragSrcId.current === glyphId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const before = e.clientX < rect.left + rect.width / 2;
    setDropTarget(prev =>
      prev?.id === glyphId && prev?.before === before ? prev : { id: glyphId, before }
    );
  }

  function handleDragLeave(e) {
    // Only clear if leaving the card entirely (not moving to a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTarget(null);
    }
  }

  function handleDrop(targetGlyphId) {
    if (!dragSrcId.current || dragSrcId.current === targetGlyphId) {
      reset();
      return;
    }
    const srcIdx = glyphs.findIndex(g => g.id === dragSrcId.current);
    const reordered = [...glyphs];
    const [moved] = reordered.splice(srcIdx, 1);
    const newDstIdx = reordered.findIndex(g => g.id === targetGlyphId);
    const insertIdx = dropTarget?.before ? newDstIdx : newDstIdx + 1;
    reordered.splice(insertIdx, 0, moved);
    onReorderGlyphs(alphabetId, reordered);
    reset();
  }

  function handleDragEnd() {
    reset();
  }

  function reset() {
    dragSrcId.current = null;
    setDraggingId(null);
    setDropTarget(null);
  }

  if (glyphs.length === 0) {
    return (
      <div className="mapping-panel mapping-panel--empty">
        <p>No glyphs yet — draw some in the Alphabet Builder first.</p>
      </div>
    );
  }

  return (
    <div className="mapping-panel">
      <h3 className="mapping-panel__heading">Your glyphs</h3>
      <p className="mapping-panel__hint">
        Select a sound on the left, then click a glyph to assign it. Drag to reorder.
      </p>

      <div className="mapping-panel__grid">
        {glyphs.map((glyph) => {
          const isSelected = selectedGlyphId === glyph.id;
          const isMapped = glyph.phonemes && glyph.phonemes.length > 0;
          const isDragging = draggingId === glyph.id;
          const isDropBefore = dropTarget?.id === glyph.id && dropTarget.before;
          const isDropAfter  = dropTarget?.id === glyph.id && !dropTarget.before;

          return (
            <div
              key={glyph.id}
              className={[
                "mapping-panel__item",
                isSelected  ? "mapping-panel__item--selected"  : "",
                isMapped    ? "mapping-panel__item--mapped"     : "",
                isDragging  ? "mapping-panel__item--dragging"   : "",
                isDropBefore ? "mapping-panel__item--drop-before" : "",
                isDropAfter  ? "mapping-panel__item--drop-after"  : "",
              ].filter(Boolean).join(" ")}
              draggable
              onDragStart={() => handleDragStart(glyph.id)}
              onDragOver={(e) => handleDragOver(e, glyph.id)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(glyph.id)}
              onDragEnd={handleDragEnd}
            >
              <button
                className="mapping-panel__glyph-btn"
                onClick={() => onSelectGlyph(glyph.id)}
                title={isMapped ? `Mapped to /${glyph.label}/ — click to remap` : "No phoneme assigned — click to assign"}
              >
                <GlyphRenderer glyph={glyph} phoneme={glyph.label || "?"} size={glyphSize} />
              </button>

              <span className={`mapping-panel__badge${!isMapped ? " mapping-panel__badge--empty" : ""}`}>
                {isMapped ? glyph.label : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
