// Container for the Translator tab. Owns input text, translation result, and error state.

import { useState } from "react";
import TextInput from "./TextInput";
import ScriptOutput from "./ScriptOutput";
import AlphabetSelector from "../shared/AlphabetSelector";
import { convertTextToPhonemes } from "../../utils/phonetics";

export default function Translator({
  activeAlphabet,
  alphabets,
  activeAlphabetId,
  onSwitchAlphabet,
  onCreateAlphabet,
  onRenameAlphabet,
  onDeleteAlphabet,
  onExportActiveAlphabet,
  onImportAlphabetFile,
  findGlyphByPhoneme,
}) {
  const [inputText, setInputText] = useState("");
  const [translationResult, setTranslationResult] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Converts the current inputText to phonemes and stores the result.
   * The CMU lookup is synchronous and fast, but isTranslating is kept for UX clarity.
   */
  function handleTranslate() {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    setError(null);

    try {
      const result = convertTextToPhonemes(inputText);
      setTranslationResult(result);
    } catch {
      setError("Translation failed. Please check your input and try again.");
      setTranslationResult(null);
    } finally {
      setIsTranslating(false);
    }
  }

  const hasMappedGlyphs =
    (activeAlphabet?.glyphs ?? []).some((g) => g.phonemes && g.phonemes.length > 0);

  return (
    <div className="translator screen">
      <div className="translator__top-bar">
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

      {!hasMappedGlyphs && activeAlphabet && (
        <p className="translator__nudge">
          Map phonemes to your glyphs in the Phoneme Mapper to see your script rendered here.
          Unmapped sounds will still show as raw IPA.
        </p>
      )}

      <TextInput
        value={inputText}
        onChange={setInputText}
        onTranslate={handleTranslate}
        isTranslating={isTranslating}
      />

      {error && <p className="translator__error" role="alert">{error}</p>}

      <ScriptOutput
        translationResult={translationResult}
        findGlyphByPhoneme={findGlyphByPhoneme}
        showApproximateIndicator={true}
      />
    </div>
  );
}
