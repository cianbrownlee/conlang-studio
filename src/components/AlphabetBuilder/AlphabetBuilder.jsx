// Container for the Alphabet Builder tab. Owns selectedGlyphId local state
// and coordinates between AlphabetSelector, DrawingCanvas, and GlyphLibrary.

import { useState } from "react";
import AlphabetSelector from "../shared/AlphabetSelector";
import DrawingCanvas from "./DrawingCanvas";
import GlyphLibrary from "./GlyphLibrary";

export default function AlphabetBuilder({
  activeAlphabet,
  alphabets,
  activeAlphabetId,
  onSwitchAlphabet,
  onCreateAlphabet,
  onRenameAlphabet,
  onDeleteAlphabet,
  onAddGlyph,
  onUpdateGlyphImage,
  onDeleteGlyph,
  onExportActiveAlphabet,
  onExportAllAlphabets,
  onImportAlphabetFile,
}) {
  // null means the canvas is in "new glyph" mode; a string ID means redraw mode
  const [selectedGlyphId, setSelectedGlyphId] = useState(null);

  const selectedGlyph =
    activeAlphabet?.glyphs.find((g) => g.id === selectedGlyphId) ?? null;

  /** Called by DrawingCanvas when the user hits Save. */
  function handleSave(imageData) {
    if (selectedGlyphId) {
      // Redrawing an existing glyph — preserve its phoneme mapping
      onUpdateGlyphImage(selectedGlyphId, imageData);
    } else {
      // Brand new glyph — phonemes will be assigned in the Phoneme Mapper
      onAddGlyph({ imageData, phonemes: [], label: "" });
    }
    setSelectedGlyphId(null);
  }

  /** Called by DrawingCanvas when the user hits Clear — returns canvas to new-glyph mode. */
  function handleClear() {
    setSelectedGlyphId(null);
  }

  /** Toggles glyph selection: clicking the same glyph again deselects it. */
  function handleSelectGlyph(glyphId) {
    setSelectedGlyphId((prev) => (prev === glyphId ? null : glyphId));
  }

  /** Deletes a glyph and deselects it if it was loaded into the canvas. */
  function handleDeleteGlyph(glyphId) {
    onDeleteGlyph(glyphId);
    if (selectedGlyphId === glyphId) setSelectedGlyphId(null);
  }

  return (
    <div className="alphabet-builder screen">
      <AlphabetSelector
        alphabets={alphabets}
        activeAlphabetId={activeAlphabetId}
        onSwitch={onSwitchAlphabet}
        onCreate={onCreateAlphabet}
        onRename={onRenameAlphabet}
        onDelete={onDeleteAlphabet}
        onExport={onExportActiveAlphabet}
        onImport={onImportAlphabetFile}
      />

      <div className="alphabet-builder__workspace">
        <div className="alphabet-builder__canvas-panel">
          <h2 className="alphabet-builder__panel-heading">
            {selectedGlyphId ? "Redrawing glyph" : "New glyph"}
          </h2>

          {/* key forces a full remount when the selected glyph changes,
              resetting canvas state cleanly without manual imperative logic */}
          <DrawingCanvas
            key={selectedGlyphId ?? "new"}
            initialImage={selectedGlyph?.imageData ?? null}
            onSave={handleSave}
            onClear={handleClear}
          />
        </div>

        <div className="alphabet-builder__library-panel">
          <GlyphLibrary
            glyphs={activeAlphabet?.glyphs ?? []}
            selectedGlyphId={selectedGlyphId}
            onSelectGlyph={handleSelectGlyph}
            onDeleteGlyph={handleDeleteGlyph}
          />
        </div>
      </div>
    </div>
  );
}
