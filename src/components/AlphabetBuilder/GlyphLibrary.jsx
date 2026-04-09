// Grid of saved glyphs for the active alphabet; click to reload into canvas for redrawing.

import GlyphRenderer from "../shared/GlyphRenderer";

export default function GlyphLibrary({ glyphs, selectedGlyphId, onSelectGlyph, onDeleteGlyph }) {
  if (glyphs.length === 0) {
    return (
      <div className="glyph-library glyph-library--empty">
        <p className="glyph-library__empty-message">
          No glyphs yet — draw something and hit Save.
        </p>
      </div>
    );
  }

  return (
    <div className="glyph-library">
      <h3 className="glyph-library__heading">
        Saved glyphs <span className="glyph-library__count">({glyphs.length})</span>
      </h3>
      <div className="glyph-library__grid">
        {glyphs.map((glyph) => (
          <div
            key={glyph.id}
            className={`glyph-library__item${selectedGlyphId === glyph.id ? " glyph-library__item--selected" : ""}`}
          >
            {/* Main click target: load this glyph into the canvas for redrawing */}
            <button
              className="glyph-library__select-btn"
              onClick={() => onSelectGlyph(glyph.id)}
              title={glyph.label ? `/${glyph.label}/ — click to redraw` : "Click to redraw"}
            >
              <GlyphRenderer glyph={glyph} phoneme={glyph.label || "?"} size={56} />
            </button>

            {/* Phoneme badge — shown only if a mapping exists */}
            {glyph.label && (
              <span className="glyph-library__phoneme-badge">{glyph.label}</span>
            )}

            {/* Delete button — sits in the corner of the item */}
            <button
              className="glyph-library__delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteGlyph(glyph.id);
              }}
              title="Delete this glyph"
              aria-label={`Delete glyph${glyph.label ? ` for /${glyph.label}/` : ""}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
