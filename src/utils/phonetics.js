// English → IPA conversion via cmu-pronouncing-dictionary with rule-based fallback

/**
 * phonetics.js
 * Converts English text to IPA phoneme arrays using the CMU Pronouncing
 * Dictionary as the primary source, with a rule-based fallback for words
 * not in the dictionary.
 *
 * The CMU dictionary uses ARPAbet notation (e.g. "K AE T" for "cat").
 * This module converts ARPAbet to IPA internally before returning results.
 *
 * Usage:
 *   import { convertTextToPhonemes } from "./phonetics";
 *   convertTextToPhonemes("hello world")
 *   // => [{ original: "hello", phonemes: ["h","ə","l","oʊ"] }, ...]
 */

import { dictionary as cmuDict } from "cmu-pronouncing-dictionary";

// ---------------------------------------------------------------------------
// ARPABET → IPA CONVERSION TABLE
// Maps CMU ARPAbet symbols to their IPA equivalents.
// Stress digits (0, 1, 2) are stripped before lookup.
// ---------------------------------------------------------------------------

const ARPABET_TO_IPA = {
  AA: "ɑ",  AE: "æ",  AH: "ə",  AO: "ɔ",  AW: "aʊ",
  AY: "aɪ", B:  "b",  CH: "tʃ", D:  "d",  DH: "ð",
  EH: "ɛ",  ER: "ɜ",  EY: "eɪ", F:  "f",  G:  "ɡ",
  HH: "h",  IH: "ɪ",  IY: "i",  JH: "dʒ", K:  "k",
  L:  "l",  M:  "m",  N:  "n",  NG: "ŋ",  OW: "oʊ",
  OY: "ɔɪ", P:  "p",  R:  "ɹ",  S:  "s",  SH: "ʃ",
  T:  "t",  TH: "θ",  UH: "ʊ",  UW: "u",  V:  "v",
  W:  "w",  Y:  "j",  Z:  "z",  ZH: "ʒ",
};

// ---------------------------------------------------------------------------
// CMU DICTIONARY LOOKUP
// ---------------------------------------------------------------------------

/**
 * Looks up a word in the CMU pronouncing dictionary and returns its IPA
 * phonemes as an array. Returns null if the word is not found.
 * The CMU dict keys are uppercase — we normalize before lookup.
 *
 * @param {string} word - a single English word
 * @returns {string[]|null} - array of IPA symbols, or null if not found
 */
function lookupWordInCMU(word) {
  const key = word.toUpperCase().replace(/[^A-Z]/g, "");
  const arpabet = cmuDict[key];
  if (!arpabet) return null;

  // arpabet is a string like "K AE T" — split and convert each symbol
  return arpabet
    .split(" ")
    .map((symbol) => {
      // Strip stress digit (the trailing 0, 1, or 2 on vowels)
      const base = symbol.replace(/[012]$/, "");
      return ARPABET_TO_IPA[base] ?? null;
    })
    .filter(Boolean); // drop any symbols not in our table
}

// ---------------------------------------------------------------------------
// RULE-BASED FALLBACK
// Handles common English spelling → phoneme patterns for words not in CMU.
// Not exhaustive — English spelling is too irregular for perfect coverage —
// but handles the most common patterns well enough for practical use.
// ---------------------------------------------------------------------------

/**
 * Attempts to convert an English word to IPA phonemes using simplified
 * grapheme-to-phoneme rules. Used only when CMU lookup fails.
 * Returns an array of IPA symbols — may be approximate.
 *
 * @param {string} word
 * @returns {string[]}
 */
function convertByRules(word) {
  const w = word.toLowerCase();
  const phonemes = [];
  let i = 0;

  while (i < w.length) {
    const remaining = w.slice(i);

    // Multi-character patterns — checked before single characters
    if (remaining.startsWith("tch"))  { phonemes.push("tʃ"); i += 3; continue; }
    if (remaining.startsWith("dge"))  { phonemes.push("dʒ"); i += 3; continue; }
    if (remaining.startsWith("sch"))  { phonemes.push("ʃ");  i += 3; continue; }
    if (remaining.startsWith("ph"))   { phonemes.push("f");  i += 2; continue; }
    if (remaining.startsWith("ch"))   { phonemes.push("tʃ"); i += 2; continue; }
    if (remaining.startsWith("sh"))   { phonemes.push("ʃ");  i += 2; continue; }
    if (remaining.startsWith("th"))   { phonemes.push("θ");  i += 2; continue; }
    if (remaining.startsWith("wh"))   { phonemes.push("w");  i += 2; continue; }
    if (remaining.startsWith("ck"))   { phonemes.push("k");  i += 2; continue; }
    if (remaining.startsWith("ng"))   { phonemes.push("ŋ");  i += 2; continue; }
    if (remaining.startsWith("qu"))   { phonemes.push("k","w"); i += 2; continue; }
    if (remaining.startsWith("oo"))   { phonemes.push("u");  i += 2; continue; }
    if (remaining.startsWith("ou"))   { phonemes.push("aʊ"); i += 2; continue; }
    if (remaining.startsWith("ow"))   { phonemes.push("oʊ"); i += 2; continue; }
    if (remaining.startsWith("oi"))   { phonemes.push("ɔɪ"); i += 2; continue; }
    if (remaining.startsWith("oy"))   { phonemes.push("ɔɪ"); i += 2; continue; }
    if (remaining.startsWith("au"))   { phonemes.push("ɔ");  i += 2; continue; }
    if (remaining.startsWith("aw"))   { phonemes.push("ɔ");  i += 2; continue; }
    if (remaining.startsWith("ai"))   { phonemes.push("eɪ"); i += 2; continue; }
    if (remaining.startsWith("ay"))   { phonemes.push("eɪ"); i += 2; continue; }
    if (remaining.startsWith("ee"))   { phonemes.push("i");  i += 2; continue; }
    if (remaining.startsWith("ea"))   { phonemes.push("i");  i += 2; continue; }
    if (remaining.startsWith("ie"))   { phonemes.push("i");  i += 2; continue; }

    // Single character fallbacks
    const ch = w[i];
    const singleMap = {
      a: "æ", b: "b",  c: "k",  d: "d",  e: "ɛ",
      f: "f", g: "ɡ",  h: "h",  i: "ɪ",  j: "dʒ",
      k: "k", l: "l",  m: "m",  n: "n",  o: "ɒ",
      p: "p", q: "k",  r: "ɹ",  s: "s",  t: "t",
      u: "ʌ", v: "v",  w: "w",  x: "ks", y: "j",
      z: "z",
    };

    if (singleMap[ch]) {
      phonemes.push(singleMap[ch]);
    }
    i++;
  }

  return phonemes;
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Tokenizes an English string into words, stripping punctuation.
 * Returns only non-empty alphabetic tokens.
 *
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  return text
    .split(/\s+/)
    .map((token) => token.replace(/[^a-zA-Z']/g, "").trim())
    .filter((token) => token.length > 0);
}

/**
 * Converts an English text string into an array of word objects, each
 * containing the original word and its IPA phoneme array.
 *
 * Words found in the CMU dictionary use precise phonemes.
 * Unknown words fall back to rule-based conversion (marked as approximate).
 *
 * @param {string} text - English input text
 * @returns {{ original: string, phonemes: string[], approximate: boolean }[]}
 */
export function convertTextToPhonemes(text) {
  const words = tokenize(text);

  return words.map((word) => {
    const cmuResult = lookupWordInCMU(word);

    if (cmuResult && cmuResult.length > 0) {
      return { original: word, phonemes: cmuResult, approximate: false };
    }

    // Fall back to rules — flag as approximate so the UI can indicate uncertainty
    const ruleResult = convertByRules(word);
    return { original: word, phonemes: ruleResult, approximate: true };
  });
}

/**
 * Converts a single English word to IPA phonemes.
 * Convenience wrapper around convertTextToPhonemes for single-word use.
 *
 * @param {string} word
 * @returns {{ phonemes: string[], approximate: boolean }}
 */
export function convertWordToPhonemes(word) {
  const result = convertTextToPhonemes(word);
  return result[0] ?? { phonemes: [], approximate: true };
}

// ---------------------------------------------------------------------------
// IPA → READABLE LATIN ROMANIZATION
// Maps IPA symbols to approximate English-readable spellings.
// Used in the Lexicon Generator to show a pronounceable form alongside glyphs.
// ---------------------------------------------------------------------------

const IPA_TO_LATIN = {
  // Affricates
  "tʃ": "ch",  "dʒ": "j",   "ts": "ts",  "tʂ": "ch",  "tɕ": "ch",
  // Diphthongs
  "eɪ": "ay",  "aɪ": "eye", "ɔɪ": "oy",  "aʊ": "ow",  "oʊ": "oh",
  "ɪə": "ear", "eə": "air", "ʊə": "ure",
  // Vowels
  "i":  "ee",  "ɪ":  "i",   "e":  "ay",  "ɛ":  "e",   "æ":  "a",
  "ə":  "uh",  "ʌ":  "uh",  "ɑ":  "ah",  "ɒ":  "o",   "ɔ":  "aw",
  "ʊ":  "oo",  "u":  "oo",  "a":  "a",   "o":  "o",   "ɜ":  "er",
  "y":  "ü",   "ɨ":  "i",   "ɯ":  "u",   "ø":  "eu",  "ɐ":  "a",
  "ɘ":  "e",   "ɵ":  "o",   "ɤ":  "u",   "œ":  "eu",  "ɞ":  "o",
  "ɶ":  "o",   "ä":  "a",   "e̞":  "e",   "o̞":  "o",
  // Plosives
  "p":  "p",   "b":  "b",   "t":  "t",   "d":  "d",   "k":  "k",
  "ɡ":  "g",   "g":  "g",   "q":  "q",   "ʔ":  "",
  // Nasals
  "m":  "m",   "n":  "n",   "ŋ":  "ng",  "ɲ":  "ny",  "ɳ":  "n",
  "ɴ":  "ng",  "ɱ":  "m",
  // Fricatives
  "f":  "f",   "v":  "v",   "θ":  "th",  "ð":  "dh",  "s":  "s",
  "z":  "z",   "ʃ":  "sh",  "ʒ":  "zh",  "h":  "h",   "x":  "kh",
  "ɣ":  "gh",  "ħ":  "hh",  "ʕ":  "a",   "χ":  "kh",  "ʁ":  "r",
  "β":  "v",   "ç":  "sh",  "ɸ":  "f",   "ʂ":  "sh",  "ʐ":  "zh",
  // Approximants & laterals
  "ɹ":  "r",   "r":  "r",   "ɾ":  "r",   "ʀ":  "r",   "j":  "y",
  "w":  "w",   "l":  "l",   "ʎ":  "ly",  "ɭ":  "l",
  // Trills & clicks (approximate)
  "ʙ":  "b",   "ɽ":  "r",   "ǀ":  "t",   "ǃ":  "k",
};

/**
 * Converts an array of IPA phoneme symbols to a readable Latin romanization.
 * Each phoneme is looked up in IPA_TO_LATIN; unknowns are passed through as-is.
 * The result is a single lowercase string an English speaker can sound out.
 *
 * @param {string[]} phonemes - array of IPA symbols e.g. ["dʒ", "ə", "n"]
 * @returns {string} - e.g. "juhn"
 */
export function convertIPAToLatin(phonemes) {
  return phonemes
    .map((p) => (p in IPA_TO_LATIN ? IPA_TO_LATIN[p] : p))
    .join("");
}