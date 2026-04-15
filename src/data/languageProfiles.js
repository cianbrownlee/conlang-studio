// Per-language phoneme frequency weights and syllable structure templates
// Shape: { name, phonemeWeights: { symbol: weight }, syllableTemplates: string[] }

/**
 * languageProfiles.js
 * Reference phoneme frequency profiles and syllable structure templates for
 * a set of world languages. Used by the lexicon generator to produce words
 * that feel like they could come from a given language tradition.
 *
 * Phoneme weights are approximate cross-linguistic frequency data drawn from
 * published phonological research (PHOIBLE, UCLA Phonological Segment Inventory
 * Database, and language-specific corpus studies). They are normalized so that
 * weights within each profile sum to 1.0.
 *
 * Important: the generator only uses phonemes that exist in the user's alphabet.
 * If a phoneme in a profile isn't mapped by the user, its weight is redistributed
 * proportionally across the phonemes that are mapped. This means a profile still
 * works even if the user's alphabet only covers a subset of the language's sounds.
 *
 * Syllable templates use C for consonant slot and V for vowel slot.
 * Templates are listed with repetition to weight them by likelihood —
 * more copies = more likely to be chosen during generation.
 */

export const LANGUAGE_PROFILES = [
  // -------------------------------------------------------------------------
  // ENGLISH
  // General American English phoneme frequencies based on corpus studies.
  // Dominated by schwa, /n/, /t/, /s/ — characteristic of English's
  // reduction of unstressed vowels and prevalence of alveolar consonants.
  // -------------------------------------------------------------------------
  {
    id: "english",
    name: "English",
    region: "Germanic",
    phonemeWeights: {
      // Vowels
      "ə":  0.114, "ɪ":  0.068, "ɛ":  0.045, "æ":  0.038,
      "ɑ":  0.036, "ɔ":  0.028, "ʊ":  0.022, "ʌ":  0.031,
      "i":  0.042, "u":  0.021, "eɪ": 0.033, "aɪ": 0.027,
      "oʊ": 0.024, "aʊ": 0.013, "ɔɪ": 0.006,
      // Consonants
      "n":  0.072, "t":  0.069, "s":  0.063, "d":  0.044,
      "l":  0.040, "ð":  0.038, "r":  0.037, "ɹ":  0.037,
      "m":  0.032, "k":  0.030, "z":  0.025, "w":  0.022,
      "v":  0.019, "b":  0.018, "f":  0.017, "h":  0.016,
      "p":  0.015, "ŋ":  0.013, "ʃ":  0.010, "j":  0.009,
      "tʃ": 0.007, "dʒ": 0.006, "θ":  0.006, "ʒ":  0.002,
    },
    // "sonorant": second onset C must be a liquid/glide (bl, br, tr, fl, etc.)
    onsetClusterMode: "sonorant",
    syllableTemplates: [
      "CV", "CV", "CV",
      "CVC", "CVC", "CVC", "CVC",
      "VC", "VC",
      "CVCV", "CVCV",
      "CVCC",
      "CCVC",
      "V",
    ],
  },

  // -------------------------------------------------------------------------
  // SPANISH
  // Castilian Spanish. Known for a simple 5-vowel system with very even
  // distribution, and frequent open syllables (CV). Feels melodic due to
  // the regularity of vowel alternation.
  // -------------------------------------------------------------------------
  {
    id: "spanish",
    name: "Spanish",
    region: "Romance",
    phonemeWeights: {
      // Vowels — notably even distribution, a hallmark of Spanish
      "a":  0.128, "e":  0.118, "o":  0.092, "i":  0.082, "u":  0.048,
      // Consonants
      "s":  0.071, "n":  0.068, "r":  0.065, "l":  0.055, "d":  0.052,
      "t":  0.046, "k":  0.040, "m":  0.038, "p":  0.032, "b":  0.028,
      "ɾ":  0.025, "ɡ":  0.020, "f":  0.015, "tʃ": 0.012, "x":  0.011,
      "j":  0.010, "ɲ":  0.008, "ʎ":  0.007, "β":  0.006, "ð":  0.005,
      "ɣ":  0.004, "w":  0.003,
    },
    syllableTemplates: [
      "CV", "CV", "CV", "CV", "CV",
      "CVC", "CVC",
      "V", "V",
      "CVCV", "CVCV", "CVCV",
      "VC",
    ],
  },

  // -------------------------------------------------------------------------
  // ARABIC
  // Modern Standard Arabic. Characterized by pharyngeal and uvular consonants,
  // a three-vowel system with length distinction, and frequent CVC templates.
  // The consonant-heavy profile gives generated words a dense, guttural feel.
  // -------------------------------------------------------------------------
  {
    id: "arabic",
    name: "Arabic",
    region: "Semitic",
    phonemeWeights: {
      // Vowels
      "a":  0.110, "i":  0.072, "u":  0.055,
      "aː": 0.048, "iː": 0.032, "uː": 0.025,
      // Consonants — note pharyngeals and uvulars
      "l":  0.072, "n":  0.058, "m":  0.052, "r":  0.048,
      "t":  0.045, "s":  0.042, "k":  0.038, "ʔ":  0.036,
      "d":  0.034, "b":  0.030, "f":  0.027, "h":  0.024,
      "ħ":  0.022, "ʕ":  0.020, "q":  0.018, "ʃ":  0.016,
      "x":  0.015, "ɣ":  0.013, "z":  0.011, "j":  0.010,
      "w":  0.009, "χ":  0.008, "ð":  0.007, "θ":  0.006,
      "ʁ":  0.005,
    },
    // Arabic does allow consonant clusters — "free" permits any two consonants
    onsetClusterMode: "free",
    syllableTemplates: [
      "CVC", "CVC", "CVC", "CVC",
      "CV", "CV",
      "CVCC",
      "CCVC",
      "VC",
    ],
  },

  // -------------------------------------------------------------------------
  // JAPANESE
  // Standard Tokyo Japanese. Almost entirely CV and V syllables — one of the
  // most constrained syllable structures of any major language. Produces
  // smooth, open, vowel-final words. Very few consonant clusters.
  // -------------------------------------------------------------------------
  {
    id: "japanese",
    name: "Japanese",
    region: "Japonic",
    phonemeWeights: {
      // Vowels — all five vowels are roughly equal, /a/ and /i/ slightly more common
      "a":  0.138, "i":  0.128, "u":  0.112, "e":  0.098, "o":  0.094,
      // Consonants
      "n":  0.082, "k":  0.065, "s":  0.058, "t":  0.055, "r":  0.048,
      "m":  0.040, "h":  0.035, "j":  0.028, "w":  0.022, "ɾ":  0.018,
      "ɡ":  0.015, "d":  0.012, "b":  0.010, "ts": 0.008, "tʃ": 0.006,
      "z":  0.005, "ɲ":  0.004,
    },
    syllableTemplates: [
      "CV", "CV", "CV", "CV", "CV", "CV",
      "V", "V", "V",
      "CVN", // N = moraic nasal, approximated as adding ŋ to end
    ],
  },

  // -------------------------------------------------------------------------
  // MANDARIN
  // Standard Mandarin Chinese (Putonghua). Characterized by a relatively
  // small consonant inventory, tonal distinctions (not modeled here), and
  // frequent use of retroflex consonants and the syllabic nasal finals.
  // -------------------------------------------------------------------------
  {
    id: "mandarin",
    name: "Mandarin",
    region: "Sino-Tibetan",
    phonemeWeights: {
      // Vowels
      "a":  0.115, "i":  0.108, "ə":  0.085, "u":  0.075,
      "ɛ":  0.055, "o":  0.048, "y":  0.038, "ɨ":  0.032,
      // Consonants — retroflex series prominent
      "n":  0.068, "l":  0.060, "t":  0.055, "s":  0.050,
      "k":  0.045, "tʂ": 0.042, "ʂ":  0.038, "tɕ": 0.035,
      "p":  0.030, "m":  0.028, "x":  0.025, "ts": 0.022,
      "tʃ": 0.018, "ɹ":  0.016, "f":  0.014, "ʐ":  0.012,
      "w":  0.010, "j":  0.010,
    },
    syllableTemplates: [
      "CV", "CV", "CV", "CV",
      "CVC", "CVC",
      "V", "V",
      "CVN",
    ],
  },

  // -------------------------------------------------------------------------
  // RUSSIAN
  // Standard Russian. Dense consonant clusters, palatalized consonants,
  // and reduction of unstressed vowels to schwa. Produces words that feel
  // heavy and consonant-rich compared to Romance or Japanese output.
  // -------------------------------------------------------------------------
  {
    id: "russian",
    name: "Russian",
    region: "Slavic",
    phonemeWeights: {
      // Vowels — /a/, /i/, /e/ dominate; unstressed vowels reduce to /ə/
      "a":  0.105, "ə":  0.095, "i":  0.085, "e":  0.065,
      "o":  0.058, "u":  0.042, "ɨ":  0.038,
      // Consonants — note palatalized pairs and sibilants
      "n":  0.068, "t":  0.062, "s":  0.058, "v":  0.052,
      "l":  0.048, "r":  0.045, "k":  0.042, "m":  0.038,
      "d":  0.035, "p":  0.030, "z":  0.025, "b":  0.022,
      "j":  0.020, "ɡ":  0.018, "f":  0.015, "x":  0.013,
      "ʃ":  0.012, "tʃ": 0.010, "ʒ":  0.008, "ɲ":  0.006,
      "ʔ":  0.004,
    },
    // Russian has true free onset clusters (zdr-, vstr-, skv-, etc.)
    onsetClusterMode: "free",
    syllableTemplates: [
      "CVC", "CVC", "CVC",
      "CV", "CV",
      "CCVC", "CCVC",
      "CVCC",
      "CCVCC",
      "VC",
    ],
  },

  // -------------------------------------------------------------------------
  // SWAHILI
  // Bantu language of East Africa. Simple, open syllable structure similar
  // to Japanese — mostly CV. Produces flowing, vowel-rich words with a
  // distinctly sub-Saharan feel. Prenasalized consonants are characteristic.
  // -------------------------------------------------------------------------
  {
    id: "swahili",
    name: "Swahili",
    region: "Bantu",
    phonemeWeights: {
      // Vowels — 5-vowel system, very even
      "a":  0.140, "i":  0.118, "u":  0.105, "e":  0.095, "o":  0.085,
      // Consonants — prenasalized stops (mb, nd, ng) are characteristic
      "n":  0.075, "k":  0.058, "m":  0.055, "l":  0.048, "t":  0.042,
      "w":  0.038, "s":  0.032, "j":  0.028, "b":  0.025, "d":  0.022,
      "ɡ":  0.018, "f":  0.015, "p":  0.013, "h":  0.012, "v":  0.010,
      "z":  0.008, "r":  0.007, "ʃ":  0.006,
    },
    syllableTemplates: [
      "CV", "CV", "CV", "CV", "CV",
      "V", "V",
      "NCV", // prenasalized — approximated as consonant cluster
      "CVCV", "CVCV",
    ],
  },

  // -------------------------------------------------------------------------
  // HAWAIIAN
  // One of the most phonologically minimal languages — only 8 consonants
  // and 5 vowels. Produces very open, vowel-heavy words. Good choice for
  // conlangs meant to feel gentle, melodic, or Polynesian in character.
  // -------------------------------------------------------------------------
  {
    id: "hawaiian",
    name: "Hawaiian",
    region: "Polynesian",
    phonemeWeights: {
      // Vowels dominate heavily
      "a":  0.175, "i":  0.148, "e":  0.128, "o":  0.108, "u":  0.088,
      // Consonants — very small inventory
      "n":  0.072, "k":  0.065, "l":  0.055, "h":  0.048,
      "m":  0.042, "p":  0.035, "w":  0.022, "ʔ":  0.014,
    },
    syllableTemplates: [
      "V", "V", "V",
      "CV", "CV", "CV", "CV",
      "VV",
      "CVV",
    ],
  },

  // -------------------------------------------------------------------------
  // FINNISH
  // Known for vowel harmony, long vowels/consonants, and absence of many
  // consonants common in European languages. Produces clean, symmetrical-
  // feeling words with lots of vowel sequences.
  // -------------------------------------------------------------------------
  {
    id: "finnish",
    name: "Finnish",
    region: "Uralic",
    phonemeWeights: {
      // Vowels — 8 vowel phonemes, fairly even
      "a":  0.118, "i":  0.108, "e":  0.095, "u":  0.082,
      "o":  0.072, "æ":  0.065, "y":  0.045, "ø":  0.032,
      // Consonants — no voiced stops in native words
      "n":  0.068, "t":  0.065, "s":  0.060, "l":  0.052,
      "k":  0.048, "m":  0.040, "p":  0.035, "r":  0.030,
      "h":  0.022, "j":  0.018, "v":  0.015, "ŋ":  0.012,
    },
    syllableTemplates: [
      "CV", "CV", "CV",
      "CVC", "CVC",
      "V", "V",
      "CVCV",
      "CVV",
    ],
  },
];

// ---------------------------------------------------------------------------
// LOOKUP HELPERS
// ---------------------------------------------------------------------------

/**
 * Returns the language profile object for a given language ID.
 * Returns undefined if the ID is not found.
 *
 * @param {string} id - e.g. "japanese"
 * @returns {Object|undefined}
 */
export function getLanguageProfile(id) {
  return LANGUAGE_PROFILES.find((profile) => profile.id === id);
}

/**
 * Returns just the names and IDs of all profiles for populating the
 * language selector dropdown.
 *
 * @returns {{ id: string, name: string, region: string }[]}
 */
export function getLanguageProfileSummaries() {
  return LANGUAGE_PROFILES.map(({ id, name, region }) => ({ id, name, region }));
}

/**
 * Given a language profile and a set of available phoneme symbols, returns
 * a normalized weight map containing only the phonemes the user has mapped.
 * Weights are redistributed proportionally so they still sum to 1.0.
 *
 * This is the function the lexicon generator calls — it never uses the raw
 * profile weights directly.
 *
 * @param {Object} profile - a language profile from LANGUAGE_PROFILES
 * @param {string[]} availablePhonemes - IPA symbols the user has drawn glyphs for
 * @returns {Object} - { [phoneme]: weight } normalized to sum to 1.0
 */
export function getFilteredPhonemeWeights(profile, availablePhonemes) {
  const unique = [...new Set(availablePhonemes)];

  // Find profile weights for phonemes the user has mapped
  let matchedTotal = 0;
  const matched = {};
  for (const [phoneme, weight] of Object.entries(profile.phonemeWeights)) {
    if (unique.includes(phoneme)) {
      matched[phoneme] = weight;
      matchedTotal += weight;
    }
  }

  // If there is no overlap at all, give every user phoneme equal weight
  if (matchedTotal === 0) {
    const w = 1 / unique.length;
    return Object.fromEntries(unique.map((p) => [p, w]));
  }

  // Phonemes the user has that aren't in the profile still get a floor weight
  // so all glyphs appear in generated output. Floor is 30% of uniform (1/N),
  // keeping unmatched phonemes clearly less common than profile-characteristic
  // ones but still visible. Using uniform-relative floor rather than a
  // profile-weight-relative floor avoids near-zero floors when profile has
  // low-weight phonemes (e.g. /ʒ/ = 0.002 in English).
  const floor = (1 / unique.length) * 0.3;

  const result = {};
  for (const phoneme of unique) {
    result[phoneme] = matched[phoneme] ?? floor;
  }

  // Normalize so weights sum to 1.0
  const total = Object.values(result).reduce((s, w) => s + w, 0);
  return Object.fromEntries(
    Object.entries(result).map(([p, w]) => [p, w / total])
  );
}