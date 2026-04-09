// Unicode writing system picker and character grid showing phonetic interpretations.

import { useState } from "react";
import { UNICODE_ALPHABETS } from "../../data/unicodeAlphabets";
import AudioButton from "../shared/AudioButton";

export default function CharacterBrowser({
  selectedAlphabetId,
  selectedSymbols,
  onSelectAlphabet,
  onSelectPhonemes,
  onPlayPhoneme,
}) {
  // Which character card is expanded to show its phoneme options
  const [expandedChar, setExpandedChar] = useState(null);

  const activeSystem =
    UNICODE_ALPHABETS.find((a) => a.id === selectedAlphabetId) ?? UNICODE_ALPHABETS[0];

  /** Collapses the expanded card when the user switches writing systems. */
  function handleSelectSystem(id) {
    setExpandedChar(null);
    onSelectAlphabet(id);
  }

  /** Clicking a character toggles its phoneme list open/closed. */
  function handleToggleChar(char) {
    setExpandedChar((prev) => (prev === char ? null : char));
  }

  /** Selecting a phoneme from the list fires onSelectPhonemes and collapses the card. */
  function handlePickPhoneme(phoneme) {
    onSelectPhonemes([phoneme], phoneme);
    setExpandedChar(null);
  }

  return (
    <div className="character-browser">
      <select
        className="character-browser__system-select"
        value={activeSystem.id}
        onChange={(e) => handleSelectSystem(e.target.value)}
        aria-label="Writing system"
      >
        {UNICODE_ALPHABETS.map((system) => (
          <option key={system.id} value={system.id}>
            {system.name} — {system.region}
          </option>
        ))}
      </select>

      <div className="character-browser__grid">
        {activeSystem.characters.map((charEntry) => {
          const isExpanded = expandedChar === charEntry.char;
          // A character is "mapped" if any of its phonemes are currently selected
          const isMapped = charEntry.phonemes.some((p) => selectedSymbols.includes(p));

          return (
            <div
              key={charEntry.char}
              className={`char-entry${isMapped ? " char-entry--mapped" : ""}${isExpanded ? " char-entry--expanded" : ""}`}
            >
              <button
                className="char-entry__char-btn"
                onClick={() => handleToggleChar(charEntry.char)}
                title={charEntry.phonemes.join(", ")}
                aria-expanded={isExpanded}
              >
                {charEntry.char}
              </button>

              {/* Phoneme list — visible only when the character is expanded */}
              {isExpanded && (
                <div className="char-entry__phoneme-list">
                  {charEntry.phonemes.map((phoneme) => {
                    const isSelected = selectedSymbols.includes(phoneme);
                    const isDefault = phoneme === charEntry.defaultPhoneme;
                    return (
                      <div
                        key={phoneme}
                        className={`char-entry__phoneme-row${isSelected ? " char-entry__phoneme-row--selected" : ""}`}
                      >
                        <button
                          className="char-entry__phoneme-pick"
                          onClick={() => handlePickPhoneme(phoneme)}
                          aria-pressed={isSelected}
                        >
                          <span className="char-entry__phoneme-symbol">/{phoneme}/</span>
                          {isDefault && (
                            <span className="char-entry__phoneme-default-mark" title="Most common reading">
                              ★
                            </span>
                          )}
                        </button>
                        <AudioButton phoneme={phoneme} onPlay={onPlayPhoneme} isLoading={false} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
