// Renders translated words as glyphs with original word and IPA shown below each.

import GlyphRenderer from "../shared/GlyphRenderer";

export default function ScriptOutput({ translationResult, findGlyphByPhoneme, showApproximateIndicator }) {
  if (!translationResult) return null;

  if (translationResult.length === 0) {
    return (
      <div className="script-output script-output--empty">
        <p>No words to display — try entering some text above.</p>
      </div>
    );
  }

  return (
    <div className="script-output">
      {translationResult.map((wordResult, wordIndex) => (
        <div
          key={wordIndex}
          className={`script-word${wordResult.approximate && showApproximateIndicator ? " script-word--approximate" : ""}`}
          title={
            wordResult.approximate
              ? `"${wordResult.original}" — approximate transcription (not in CMU dictionary)`
              : undefined
          }
        >
          {/* Glyph row — one renderer per phoneme in the word */}
          <div className="script-word__glyphs">
            {wordResult.phonemes.map((phoneme, i) => {
              const glyph = findGlyphByPhoneme(phoneme);
              return (
                <GlyphRenderer key={i} glyph={glyph} phoneme={phoneme} size={44} />
              );
            })}
          </div>

          {/* Original English word */}
          <div className="script-word__original">{wordResult.original}</div>

          {/* IPA transcription */}
          <div className="script-word__ipa">/{wordResult.phonemes.join("")}/</div>

          {/* Tilde marker for approximate transcriptions — subtle, not alarming */}
          {wordResult.approximate && showApproximateIndicator && (
            <span
              className="script-word__approximate-mark"
              title="Approximate — word not found in CMU dictionary"
            >
              ~
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
