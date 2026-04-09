// Container for the Phoneme Mapper tab. Owns browse mode, selected phonemes,
// selected writing system, and selected glyph. Wires useAudio into the browsers.

import { useState } from "react";
import AlphabetSelector from "../shared/AlphabetSelector";
import IPABrowser from "./IPABrowser";
import CharacterBrowser from "./CharacterBrowser";
import MappingPanel from "./MappingPanel";
import { useAudio } from "../../hooks/useAudio";

export default function PhonemeMapper({
  activeAlphabet,
  alphabets,
  activeAlphabetId,
  onSwitchAlphabet,
  onCreateAlphabet,
  onRenameAlphabet,
  onDeleteAlphabet,
  onUpdateGlyphPhonemes,
  onExportActiveAlphabet,
  onExportAllAlphabets,
  onImportAlphabetFile,
}) {
  const [browseMode, setBrowseMode] = useState("ipa");
  // Phonemes staged for assignment — user selects here, then clicks a glyph
  const [selectedIPASymbols, setSelectedIPASymbols] = useState([]);
  const [selectedWritingSystemId, setSelectedWritingSystemId] = useState(null);
  // Which glyph in MappingPanel is highlighted after a successful assignment
  const [selectedGlyphId, setSelectedGlyphId] = useState(null);

  const { playPhoneme } = useAudio();

  /** Switches browse mode and clears staged phonemes to avoid stale selections. */
  function handleSwitchMode(mode) {
    setBrowseMode(mode);
    setSelectedIPASymbols([]);
  }

  /** Toggles a single IPA symbol in/out of the staged selection. */
  function handleSelectSymbol(symbol) {
    setSelectedIPASymbols((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  }

  /** Sets the staged selection from the character browser (replaces, doesn't toggle). */
  function handleSelectPhonemes(phonemes) {
    setSelectedIPASymbols(phonemes);
  }

  /**
   * Handles a glyph click in the mapping panel.
   * If phonemes are staged, assigns them immediately.
   * If nothing is staged, just highlights the glyph so the user can see its current mapping.
   */
  function handleSelectGlyph(glyphId) {
    if (selectedIPASymbols.length === 0) {
      setSelectedGlyphId((prev) => (prev === glyphId ? null : glyphId));
      return;
    }

    const label = selectedIPASymbols[0]; // primary phoneme becomes the display label
    onUpdateGlyphPhonemes(glyphId, selectedIPASymbols, label);
    setSelectedGlyphId(glyphId);
    // Keep the selection staged so the user can quickly assign to more glyphs
  }

  const hasSelection = selectedIPASymbols.length > 0;

  return (
    <div className="phoneme-mapper screen">
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

      {/* Mode toggle */}
      <div className="phoneme-mapper__mode-toggle" role="group" aria-label="Browse mode">
        <button
          className={`toggle-btn${browseMode === "ipa" ? " toggle-btn--active" : ""}`}
          onClick={() => handleSwitchMode("ipa")}
          aria-pressed={browseMode === "ipa"}
        >
          Browse by IPA
        </button>
        <button
          className={`toggle-btn${browseMode === "character" ? " toggle-btn--active" : ""}`}
          onClick={() => handleSwitchMode("character")}
          aria-pressed={browseMode === "character"}
        >
          Browse by Character
        </button>
      </div>

      {/* Selection bar — shows staged phonemes and a clear button */}
      {hasSelection && (
        <div className="phoneme-mapper__selection-bar">
          <span className="phoneme-mapper__selection-label">
            Ready to assign:{" "}
            {selectedIPASymbols.map((s) => `/${s}/`).join(" + ")}
          </span>
          <button
            className="button button--ghost button--small"
            onClick={() => setSelectedIPASymbols([])}
          >
            Clear
          </button>
        </div>
      )}

      <div className="phoneme-mapper__workspace">
        {/* Left: phoneme browser */}
        <div className="phoneme-mapper__browser-panel">
          {browseMode === "ipa" ? (
            <IPABrowser
              selectedSymbols={selectedIPASymbols}
              onSelectSymbol={handleSelectSymbol}
              onPlayPhoneme={playPhoneme}
            />
          ) : (
            <CharacterBrowser
              selectedAlphabetId={selectedWritingSystemId}
              selectedSymbols={selectedIPASymbols}
              onSelectAlphabet={setSelectedWritingSystemId}
              onSelectPhonemes={handleSelectPhonemes}
              onPlayPhoneme={playPhoneme}
            />
          )}
        </div>

        {/* Right: glyph grid for assignment */}
        <div className="phoneme-mapper__mapping-panel">
          <MappingPanel
            glyphs={activeAlphabet?.glyphs ?? []}
            selectedGlyphId={selectedGlyphId}
            onSelectGlyph={handleSelectGlyph}
            onAssignPhonemes={onUpdateGlyphPhonemes}
          />
        </div>
      </div>
    </div>
  );
}
