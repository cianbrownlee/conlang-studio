// Renders a Zipf-sampled gibberish paragraph in three forms: script, phonetic, romanized.

import GlyphRenderer from "../shared/GlyphRenderer";
import { convertIPAToLatin } from "../../utils/phonetics";

export default function TextSample({ sentences, findGlyphByPhoneme }) {
  if (!sentences || sentences.length === 0) return null;

  return (
    <div className="text-sample">
      <h3 className="text-sample__heading">Text sample</h3>

      {/* ── Script ── */}
      <div className="text-sample__section">
        <span className="text-sample__section-label">Script</span>
        <div className="text-sample__script">
          {sentences.map((sentence, si) => (
            <span key={si} className="text-sample__sentence">
              {sentence.map((word, wi) => (
                <span key={wi} className="text-sample__word">
                  {word.phonemes.map((phoneme, pi) => {
                    const glyph = findGlyphByPhoneme(phoneme);
                    return (
                      <GlyphRenderer key={pi} glyph={glyph} phoneme={phoneme} size={32} />
                    );
                  })}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── Phonetic ── */}
      <div className="text-sample__section">
        <span className="text-sample__section-label">Phonetic</span>
        <p className="text-sample__phonetic">
          {sentences.map((sentence, si) => (
            <span key={si}>
              {sentence.map((word) => `/${word.phonemes.join("")}/`).join(" ")}.{" "}
            </span>
          ))}
        </p>
      </div>

      {/* ── Romanized ── */}
      <div className="text-sample__section">
        <span className="text-sample__section-label">Romanized</span>
        <p className="text-sample__romanized">
          {sentences.map((sentence, si) => {
            const romanWords = sentence.map((word) => convertIPAToLatin(word.phonemes));
            // Capitalize first word of each sentence
            if (romanWords.length > 0) {
              romanWords[0] = romanWords[0].charAt(0).toUpperCase() + romanWords[0].slice(1);
            }
            return <span key={si}>{romanWords.join(" ")}. </span>;
          })}
        </p>
      </div>
    </div>
  );
}
