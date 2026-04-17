// Container for the Alphabet Builder tab. Shows all alphabets as expandable sections.
// Drawing happens in a modal. No longer uses the shared AlphabetSelector.

import { useState, useRef } from "react";
import GlyphLibrary from "./GlyphLibrary";
import DrawingModal from "./DrawingModal";

export default function AlphabetBuilder({
  alphabets,
  onSwitchAlphabet,
  onCreateAlphabet,
  onRenameAlphabet,
  onDeleteAlphabet,
  onAddGlyph,
  onUpdateGlyphImage,
  onDeleteGlyph,
  onReorderGlyphs,
  onExportAlphabet,
  onImportAlphabetFile,
}) {
  // All alphabets start expanded
  const [expandedIds, setExpandedIds] = useState(() => new Set(alphabets.map((a) => a.id)));
  const [modalState, setModalState] = useState({ open: false, alphabetId: null, glyphId: null });
  const importInputRef = useRef(null);

  // Keep expandedIds in sync when new alphabets are created
  // (new alphabet IDs won't be in the initial Set)

  /** Toggles an alphabet section open or closed. */
  function toggleSection(alphabetId) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(alphabetId)) next.delete(alphabetId);
      else next.add(alphabetId);
      return next;
    });
  }

  /** Opens the drawing modal for a new glyph in the given alphabet. */
  function handleAddGlyph(alphabetId) {
    onSwitchAlphabet(alphabetId); // ensure onAddGlyph targets the right alphabet
    setModalState({ open: true, alphabetId, glyphId: null });
  }

  /** Opens the drawing modal to redraw an existing glyph. */
  function handleSelectGlyph(alphabetId, glyphId) {
    onSwitchAlphabet(alphabetId);
    setModalState({ open: true, alphabetId, glyphId });
  }

  function handleModalClose() {
    setModalState({ open: false, alphabetId: null, glyphId: null });
  }

  /** Called when DrawingModal saves. Routes to add or update depending on modal state. */
  function handleModalSave(imageData) {
    if (modalState.glyphId) {
      onUpdateGlyphImage(modalState.glyphId, imageData);
    } else {
      onAddGlyph({ imageData, phonemes: [], label: "" });
      // Expand the section so the new glyph is visible
      setExpandedIds((prev) => new Set(prev).add(modalState.alphabetId));
    }
  }

  function handleCreate() {
    const name = prompt("Name your new alphabet (e.g. Elvish, Runic, Cipher):");
    if (!name?.trim()) return;
    const created = onCreateAlphabet(name.trim());
    // Auto-expand the new section
    if (created?.id) {
      setExpandedIds((prev) => new Set(prev).add(created.id));
    }
  }

  function handleRename(alphabet) {
    const name = prompt("Rename alphabet:", alphabet.name);
    if (name?.trim()) onRenameAlphabet(alphabet.id, name.trim());
  }

  function handleDelete(alphabet) {
    if (window.confirm(`Delete "${alphabet.name}"? This cannot be undone.`)) {
      onDeleteAlphabet(alphabet.id);
    }
  }

  function handleExport(alphabet) {
    // Export the specific alphabet directly — no need to switch active state first.
    onExportAlphabet(alphabet);
  }

  function handleImportChange(e) {
    const file = e.target.files[0];
    if (file) onImportAlphabetFile(file);
    e.target.value = "";
  }

  // Find the glyph being drawn (for modal title)
  const modalAlphabet = alphabets.find((a) => a.id === modalState.alphabetId) ?? null;
  const modalGlyph = modalAlphabet?.glyphs.find((g) => g.id === modalState.glyphId) ?? null;

  return (
    <div className="alphabet-builder screen">

      {/* Top action bar */}
      <div className="alphabet-builder__top-bar">
        <button className="button button--primary" onClick={handleCreate}>
          + New Alphabet
        </button>
        <label className="button button--ghost" title="Load a .conlang file">
          Import
          <input
            ref={importInputRef}
            type="file"
            accept=".conlang"
            className="visually-hidden"
            onChange={handleImportChange}
          />
        </label>
      </div>

      {/* Accordion list of all alphabets */}
      {alphabets.length === 0 && (
        <p className="alphabet-builder__empty">
          No alphabets yet — create one above to get started.
        </p>
      )}

      {alphabets.map((alphabet) => {
        const isExpanded = expandedIds.has(alphabet.id);
        return (
          <div key={alphabet.id} className="alphabet-section">
            <div
              className="alphabet-section__header"
              onClick={() => toggleSection(alphabet.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && toggleSection(alphabet.id)}
              aria-expanded={isExpanded}
            >
              <span className={`alphabet-section__chevron${isExpanded ? " alphabet-section__chevron--open" : ""}`}>
                ▶
              </span>
              <span className="alphabet-section__name">{alphabet.name}</span>
              <span className="alphabet-section__meta">
                {alphabet.glyphs.length} {alphabet.glyphs.length === 1 ? "glyph" : "glyphs"}
              </span>

              {/* Action buttons — stop click from bubbling to the toggle */}
              <div className="alphabet-section__actions" onClick={(e) => e.stopPropagation()}>
                <button className="button button--ghost button--small" onClick={() => handleRename(alphabet)}>
                  Rename
                </button>
                <button className="button button--ghost button--small" onClick={() => handleExport(alphabet)}>
                  Download
                </button>
                <button
                  className="button button--ghost button--small button--danger"
                  onClick={() => handleDelete(alphabet)}
                >
                  Delete
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="alphabet-section__body">
                <GlyphLibrary
                  glyphs={alphabet.glyphs}
                  alphabetId={alphabet.id}
                  onSelectGlyph={(glyphId) => handleSelectGlyph(alphabet.id, glyphId)}
                  onDeleteGlyph={onDeleteGlyph}
                  onAddGlyph={() => handleAddGlyph(alphabet.id)}
                  onReorderGlyphs={onReorderGlyphs}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Drawing modal — rendered once at the top level, controlled by modalState */}
      <DrawingModal
        isOpen={modalState.open}
        initialImage={modalGlyph?.imageData ?? null}
        glyphLabel={modalGlyph?.label ?? null}
        onSave={handleModalSave}
        onClose={handleModalClose}
      />
    </div>
  );
}
