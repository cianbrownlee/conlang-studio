// Glyph grid for the active alphabet; click a glyph to assign the selected phoneme(s).

import GlyphRenderer from "../shared/GlyphRenderer";

export default function MappingPanel({ glyphs, selectedGlyphId, onSelectGlyph, onAssignPhonemes }) {
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
        Select a sound on the left, then click a glyph to assign it.
      </p>

      <div className="mapping-panel__grid">
        {glyphs.map((glyph) => {
          const isSelected = selectedGlyphId === glyph.id;
          const isMapped = glyph.phonemes && glyph.phonemes.length > 0;

          return (
            <div
              key={glyph.id}
              className={`mapping-panel__item${isSelected ? " mapping-panel__item--selected" : ""}${isMapped ? " mapping-panel__item--mapped" : ""}`}
            >
              <button
                className="mapping-panel__glyph-btn"
                onClick={() => onSelectGlyph(glyph.id)}
                title={
                  isMapped
                    ? `Mapped to /${glyph.label}/ — click to remap`
                    : "No phoneme assigned — click to assign"
                }
              >
                <GlyphRenderer glyph={glyph} phoneme={glyph.label || "?"} size={56} />
              </button>

              {/* Badge shows the assigned phoneme, or a dash if unmapped */}
              <span
                className={`mapping-panel__badge${!isMapped ? " mapping-panel__badge--empty" : ""}`}
              >
                {isMapped ? glyph.label : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
