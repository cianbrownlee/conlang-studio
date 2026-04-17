// Container for the Phoneme Mapper tab. Owns staged phonemes and selected glyph.
// Browse mode and writing system selection are lifted to App.jsx for persistence
// across tab switches.

import { useState } from "react";
import AlphabetSelector from "../shared/AlphabetSelector";
import IPABrowser from "./IPABrowser";
import CharacterBrowser from "./CharacterBrowser";
import MappingPanel from "./MappingPanel";
import { useAudio } from "../../hooks/useAudio";
import { getIPAEntry } from "../../data/ipa";

/** Renders bolded example words for a single IPA symbol. */
function SelectionExamples({ phoneme }) {
  const entry = getIPAEntry(phoneme);
  if (!entry) return null;
  if (!entry.examples || entry.examples.length === 0) {
    return <span className="phoneme-mapper__selection-examples">{entry.description}</span>;
  }
  return (
    <span className="phoneme-mapper__selection-examples">
      {entry.examples.map(({ word, bold }, i) => {
        const idx = word.indexOf(bold);
        if (idx === -1) return <span key={i}>{i > 0 ? ", " : ""}{word}</span>;
        return (
          <span key={i}>
            {i > 0 ? ", " : ""}
            {word.slice(0, idx)}<strong>{bold}</strong>{word.slice(idx + bold.length)}
          </span>
        );
      })}
    </span>
  );
}

export default function PhonemeMapper({
  activeAlphabet,
  alphabets,
  activeAlphabetId,
  onSwitchAlphabet,
  onCreateAlphabet,
  onRenameAlphabet,
  onDeleteAlphabet,
  onUpdateGlyphPhonemes,
  onReorderGlyphs,
  onExportActiveAlphabet,
  onImportAlphabetFile,
  // Lifted state for persistence across tab switches
  browseMode,
  onChangeBrowseMode,
  writingSystemId,
  onChangeWritingSystemId,
}) {
  // Phonemes staged for assignment — user selects here, then clicks a glyph
  const [selectedIPASymbols, setSelectedIPASymbols] = useState([]);
  // Which glyph in MappingPanel is highlighted after a successful assignment
  const [selectedGlyphId, setSelectedGlyphId] = useState(null);

  const { playPhoneme, loadingSymbol } = useAudio();

  /** Switches browse mode and clears staged phonemes to avoid stale selections. */
  function handleSwitchMode(mode) {
    onChangeBrowseMode(mode);
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
      {/* Top bar: compact switch-only alphabet selector */}
      <div className="phoneme-mapper__top-bar">
        <AlphabetSelector
          alphabets={alphabets}
          activeAlphabetId={activeAlphabetId}
          onSwitch={onSwitchAlphabet}
          onCreate={onCreateAlphabet}
          onRename={onRenameAlphabet}
          onDelete={onDeleteAlphabet}
          onExport={onExportActiveAlphabet}
          onImport={onImportAlphabetFile}
          compact={true}
          switchOnly={true}
        />
      </div>

      {/* Selection bar — shows staged phonemes and a clear button */}
      {hasSelection && (
        <div className="phoneme-mapper__selection-bar">
          <span className="phoneme-mapper__selection-label">
            Ready to assign:{" "}
            {selectedIPASymbols.map((s) => `/${s}/`).join(" + ")}
            {browseMode === "character" && selectedIPASymbols.length > 0 && (
              <SelectionExamples phoneme={selectedIPASymbols[0]} />
            )}
          </span>
          <button
            className="button button--ghost button--small"
            onClick={() => setSelectedIPASymbols([])}
          >
            Clear
          </button>
        </div>
      )}

      {/* Mode tabs — directly above the workspace */}
      <div className="phoneme-mapper__mode-tabs" role="group" aria-label="Browse mode">
        <button
          className={`toggle-btn${browseMode === "character" ? " toggle-btn--active" : ""}`}
          onClick={() => handleSwitchMode("character")}
          aria-pressed={browseMode === "character"}
        >
          Browse by Character
        </button>
        <button
          className={`toggle-btn${browseMode === "ipa" ? " toggle-btn--active" : ""}`}
          onClick={() => handleSwitchMode("ipa")}
          aria-pressed={browseMode === "ipa"}
        >
          Browse by IPA
        </button>
      </div>

      <div className={`phoneme-mapper__workspace${browseMode === "ipa" ? " phoneme-mapper__workspace--stacked" : ""}`}>
        {/* Left: phoneme browser */}
        <div className="phoneme-mapper__browser-panel">
          {browseMode === "ipa" ? (
            <IPABrowser
              selectedSymbols={selectedIPASymbols}
              onSelectSymbol={handleSelectSymbol}
              onPlayPhoneme={playPhoneme}
              loadingSymbol={loadingSymbol}
            />
          ) : (
            <CharacterBrowser
              selectedAlphabetId={writingSystemId}
              selectedSymbols={selectedIPASymbols}
              onSelectAlphabet={onChangeWritingSystemId}
              onSelectPhonemes={handleSelectPhonemes}
              onPlayPhoneme={playPhoneme}
              loadingSymbol={loadingSymbol}
            />
          )}
        </div>

        {/* Right: glyph grid for assignment */}
        <div className="phoneme-mapper__mapping-panel">
          <MappingPanel
            glyphs={activeAlphabet?.glyphs ?? []}
            alphabetId={activeAlphabetId}
            selectedGlyphId={selectedGlyphId}
            onSelectGlyph={handleSelectGlyph}
            onReorderGlyphs={onReorderGlyphs}
            glyphSize={browseMode === "ipa" ? 96 : 72}
          />
        </div>
      </div>
    </div>
  );
}
