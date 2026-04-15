// Weighted phoneme sampling and Zipf-distributed word frequency generation

/**
 * lexiconGenerator.js
 * Generates a Zipf-distributed word list from the user's alphabet using
 * a reference language profile for phoneme weighting and syllable structure.
 *
 * Pipeline:
 *   1. Extract phonemes from the user's mapped glyphs
 *   2. Filter the language profile weights to only available phonemes
 *   3. For each word: pick a syllable structure, fill each slot by
 *      weighted-random phoneme selection
 *   4. Rank words by Zipf frequency (rank 1 = most common)
 *   5. Return word objects with phonemes, rank, and frequency weight
 */

import { getFilteredPhonemeWeights } from "../data/languageProfiles";
import { IPA_SYMBOLS } from "../data/ipa";
import { pickWordStructure, filterPhonemesForSlot } from "./syllableTemplates";

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

// Consonants that can appear as the second C in an onset cluster in most
// European/sonorant-cluster languages (bl, br, tr, dr, fl, fr, kl, kr, etc.)
// Languages with "sonorant" onsetClusterMode restrict to this set for the
// second onset consonant. "free" mode skips this filter entirely.
const ONSET_SECOND_C = new Set(["l", "r", "ɹ", "ɾ", "w", "j", "ʎ"]);

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Returns true if the given IPA symbol is a vowel.
 * Looks up the symbol in the IPA dataset.
 *
 * @param {string} symbol
 * @returns {boolean}
 */
function isVowel(symbol) {
  const entry = IPA_SYMBOLS.find((s) => s.symbol === symbol);
  return entry ? entry.isVowel : false;
}

/**
 * Selects a phoneme from a weighted map using weighted random sampling.
 * Returns null if the candidate pool is empty.
 *
 * @param {Object} weightMap - { [phoneme]: weight } — weights must sum to 1.0
 * @param {string[]} candidates - subset of phonemes to sample from
 * @returns {string|null}
 */
function weightedRandomPick(weightMap, candidates) {
  if (!candidates || candidates.length === 0) return null;

  // Build a normalized weight array for just the candidates
  const weights = candidates.map((p) => weightMap[p] ?? 0);
  const total = weights.reduce((sum, w) => sum + w, 0);

  // If no weights exist for these candidates, fall back to uniform random
  if (total === 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // Weighted random selection via cumulative distribution
  let rand = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return candidates[i];
  }

  // Floating point safety fallback
  return candidates[candidates.length - 1];
}

/**
 * Generates a single word as an array of IPA phoneme strings.
 * Returns null if the phoneme inventory is too small to fill the structure.
 *
 * @param {Object} weightMap - filtered phoneme weights for this language + alphabet
 * @param {string[]} allPhonemes - all phonemes available in the user's alphabet
 * @param {string[]} syllableTemplates - template array from the language profile
 * @param {string} onsetClusterMode - "sonorant" | "free" (default "sonorant")
 * @returns {string[]|null}
 */
function generateWord(weightMap, allPhonemes, syllableTemplates, onsetClusterMode = "sonorant") {
  const structure = pickWordStructure(syllableTemplates);
  const phonemes = [];

  for (const syllable of structure) {
    // Track onset context: consonants before the first vowel in this syllable
    let vowelSeen = false;
    let prevOnsetConsonant = null;

    for (const slotType of syllable) {
      let candidates = filterPhonemesForSlot(allPhonemes, slotType, isVowel);

      // If no candidates exist for this slot type, skip it gracefully
      if (candidates.length === 0) continue;

      if (slotType === "consonant" && !vowelSeen && prevOnsetConsonant !== null) {
        // This is the second (or later) consonant in an onset cluster.
        // Apply language-specific cluster restrictions.
        if (onsetClusterMode === "sonorant") {
          // Restrict to liquids/glides (l, r, w, j…) — gives bl, br, tr, fl, etc.
          // Fall through to full set if the user's alphabet has no sonorants.
          const sonorants = candidates.filter((c) => ONSET_SECOND_C.has(c));
          if (sonorants.length > 0) candidates = sonorants;
        }
        // Always prevent geminates (tt, ss, etc.) regardless of mode
        const noGeminate = candidates.filter((c) => c !== prevOnsetConsonant);
        if (noGeminate.length > 0) candidates = noGeminate;
      }

      const picked = weightedRandomPick(weightMap, candidates);
      if (picked) {
        phonemes.push(picked);
        if (slotType === "vowel") {
          vowelSeen = true;
          prevOnsetConsonant = null;
        } else if (slotType === "consonant" && !vowelSeen) {
          prevOnsetConsonant = picked;
        }
      }
    }
  }

  return phonemes.length > 0 ? phonemes : null;
}

/**
 * Computes the Zipf frequency weight for a given rank.
 * Zipf's law: frequency ∝ 1/rank.
 * Normalized so that rank 1 has weight 1.0 and all others are proportional.
 *
 * @param {number} rank - 1-indexed rank (1 = most common)
 * @param {number} totalWords - total number of words in the lexicon
 * @returns {number} - normalized frequency between 0 and 1
 */
function zipfWeight(rank, totalWords) {
  // Harmonic number H_n = sum of 1/k for k=1 to n
  // Used to normalize so weights sum to 1.0
  let H = 0;
  for (let k = 1; k <= totalWords; k++) H += 1 / k;
  return (1 / rank) / H;
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Generates a Zipf-distributed lexicon from the user's alphabet.
 *
 * @param {Object} activeAlphabet - the current alphabet from useAlphabet
 * @param {Object} languageProfile - a profile object from languageProfiles.js
 * @param {number} wordCount - how many words to generate (10–150)
 * @returns {{
 *   rank: number,
 *   phonemes: string[],
 *   frequencyWeight: number,   // 0–1, used for opacity in the UI
 *   relativeFrequency: number  // per-thousand frequency for display
 * }[]}
 */
export function generateLexicon(activeAlphabet, languageProfile, wordCount) {
  // Extract the IPA phonemes the user has actually mapped, deduplicated so that
  // glyphs sharing a phoneme don't inflate that phoneme's selection probability
  const availablePhonemes = [
    ...new Set(
      activeAlphabet.glyphs
        .filter((g) => g.phonemes && g.phonemes.length > 0)
        .flatMap((g) => g.phonemes)
    ),
  ];

  if (availablePhonemes.length === 0) return [];

  // Get weights filtered to only what the user has mapped
  const weightMap = getFilteredPhonemeWeights(languageProfile, availablePhonemes);

  const { syllableTemplates, onsetClusterMode = "sonorant" } = languageProfile;
  const words = [];
  const seen = new Set(); // prevent duplicates
  let attempts = 0;
  const maxAttempts = wordCount * 30; // give up after this many tries

  while (words.length < wordCount && attempts < maxAttempts) {
    attempts++;
    const phonemes = generateWord(weightMap, availablePhonemes, syllableTemplates, onsetClusterMode);
    if (!phonemes) continue;

    const key = phonemes.join("-");
    if (seen.has(key)) continue;

    seen.add(key);
    words.push(phonemes);
  }

  // Assign Zipf ranks and frequency weights
  return words.map((phonemes, index) => {
    const rank = index + 1;
    const frequencyWeight = zipfWeight(rank, words.length);
    return {
      rank,
      phonemes,
      frequencyWeight,
      relativeFrequency: Math.round(frequencyWeight * 1000), // per-thousand
    };
  });
}

/**
 * Samples words from a generated lexicon using Zipf frequency weights, then
 * groups them into sentences of random length (5–9 words each).
 * Common words appear more often — the result feels like natural-frequency text.
 *
 * @param {Object[]} wordList - output of generateLexicon()
 * @param {number} targetWordCount - approximate total words to sample
 * @returns {Object[][]} - array of sentences, each sentence an array of word objects
 */
export function sampleTextFromLexicon(wordList, targetWordCount = 64) {
  if (!wordList || wordList.length === 0) return [];

  // Build cumulative weight array for weighted random selection
  const cumulative = [];
  let total = 0;
  for (const word of wordList) {
    total += word.frequencyWeight;
    cumulative.push(total);
  }

  /** Picks one word from wordList using frequency weights. */
  function pickWord() {
    const r = Math.random() * total;
    for (let i = 0; i < cumulative.length; i++) {
      if (r <= cumulative[i]) return wordList[i];
    }
    return wordList[wordList.length - 1];
  }

  const sentences = [];
  let wordsRemaining = targetWordCount;

  while (wordsRemaining > 0) {
    // Sentence length: 5–9 words, but don't exceed what's left
    const sentenceLength = Math.min(
      5 + Math.floor(Math.random() * 5),
      wordsRemaining
    );
    const sentence = [];
    for (let i = 0; i < sentenceLength; i++) {
      sentence.push(pickWord());
    }
    sentences.push(sentence);
    wordsRemaining -= sentenceLength;
  }

  return sentences;
}