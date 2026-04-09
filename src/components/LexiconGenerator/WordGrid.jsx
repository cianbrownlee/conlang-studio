// Generated word list rendered as glyphs with IPA transcription and Zipf-weighted opacity.

import GlyphRenderer from "../shared/GlyphRenderer";
import { convertIPAToLatin } from "../../utils/phonetics";

export default function WordGrid({ wordList, glyphs, findGlyphByPhoneme }) {
  if (wordList.length === 0) {
    return (
      <div className="word-grid word-grid--empty">
        <p>Hit Generate to create words in your script.</p>
      </div>
    );
  }

  return (
    <div className="word-grid">
      {wordList.map((word) => (
        <div
          key={word.rank}
          className="word-entry"
          // Border brightness reflects frequency — common words get a more vivid border,
          // rare words a subtle one. Avoids washing out the gold text with opacity.
          style={{ borderColor: `rgba(201, 168, 76, ${Math.max(0.15, word.frequencyWeight * 3)})` }}
          title={`Rank ${word.rank} — ${word.relativeFrequency}‰`}
        >
          {/* Glyph row — one GlyphRenderer per phoneme */}
          <div className="word-entry__glyphs">
            {word.phonemes.map((phoneme, i) => {
              const glyph = findGlyphByPhoneme(phoneme);
              return (
                <GlyphRenderer key={i} glyph={glyph} phoneme={phoneme} size={40} />
              );
            })}
          </div>

          {/* Readable Latin romanization — pronounceable for English speakers */}
          <div className="word-entry__roman">{convertIPAToLatin(word.phonemes)}</div>

          {/* IPA transcription — smaller, secondary */}
          <div className="word-entry__ipa">/{word.phonemes.join("")}/</div>
        </div>
      ))}
    </div>
  );
}
