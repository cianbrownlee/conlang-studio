// Container for the Lexicon Generator tab. Owns language selection, word count,
// word list, and the sampled text paragraph. Generate button and slider live here.

import { useState } from "react";
import AlphabetSelector from "../shared/AlphabetSelector";
import LanguageSelector from "./LanguageSelector";
import WordGrid from "./WordGrid";
import TextSample from "./TextSample";
import { getLanguageProfile } from "../../data/languageProfiles";
import { generateLexicon, sampleTextFromLexicon } from "../../utils/lexiconGenerator";

export default function LexiconGenerator({
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
  selectedLanguageId,
  onSelectLanguage,
}) {
  const [wordCount, setWordCount] = useState(40);
  const [sampleLength, setSampleLength] = useState(64);
  const [wordList, setWordList] = useState([]);
  const [textSample, setTextSample] = useState([]);

  const hasMappedGlyphs =
    (activeAlphabet?.glyphs ?? []).some((g) => g.phonemes && g.phonemes.length > 0);

  /** Generates both the lexicon and the sampled text paragraph in one click. */
  function handleGenerate() {
    if (!activeAlphabet || !hasMappedGlyphs) return;
    const profile = getLanguageProfile(selectedLanguageId);
    if (!profile) return;
    const result = generateLexicon(activeAlphabet, profile, wordCount);
    setWordList(result);
    setTextSample(sampleTextFromLexicon(result, sampleLength));
  }

  return (
    <div className="lexicon-generator screen">
      <div className="lexicon-generator__top-bar">
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

      <div className="lexicon-generator__controls">
        <LanguageSelector
          selectedLanguageId={selectedLanguageId}
          onSelectLanguage={onSelectLanguage}
        />

        <div className="lexicon-generator__word-count">
          <label htmlFor="word-count-slider" className="lexicon-generator__count-label">
            Vocabulary: <strong>{wordCount}</strong>
          </label>
          <input
            id="word-count-slider"
            type="range"
            min={10}
            max={150}
            step={5}
            value={wordCount}
            onChange={(e) => setWordCount(Number(e.target.value))}
            className="lexicon-generator__count-slider"
          />
        </div>

        <div className="lexicon-generator__word-count">
          <label htmlFor="sample-length-slider" className="lexicon-generator__count-label">
            Sample length: <strong>{sampleLength}</strong>
          </label>
          <input
            id="sample-length-slider"
            type="range"
            min={20}
            max={200}
            step={4}
            value={sampleLength}
            onChange={(e) => setSampleLength(Number(e.target.value))}
            className="lexicon-generator__count-slider"
          />
        </div>

        <button
          className="button button--primary"
          onClick={handleGenerate}
          disabled={!hasMappedGlyphs}
          title={
            !hasMappedGlyphs
              ? "Assign phonemes to your glyphs in the Phoneme Mapper first"
              : `Generate ${wordCount} words`
          }
        >
          Generate
        </button>

        {!hasMappedGlyphs && activeAlphabet && (
          <p className="lexicon-generator__nudge">
            Map phonemes to your glyphs in the Phoneme Mapper, then come back here.
          </p>
        )}
      </div>

      <WordGrid
        wordList={wordList}
        glyphs={activeAlphabet?.glyphs ?? []}
        findGlyphByPhoneme={findGlyphByPhoneme}
      />

      <TextSample
        sentences={textSample}
        findGlyphByPhoneme={findGlyphByPhoneme}
      />
    </div>
  );
}
