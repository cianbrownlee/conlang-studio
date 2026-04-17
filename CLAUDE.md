# ConAlpha — Project Specification

## What This Is

A web-based tool for building custom writing systems (constructed language scripts).
Users draw their own glyphs, map them to phonetic sounds, and the app either generates
naturalistic gibberish in their script or translates real English text into it.

Deployed as a static site (no backend, no database). Free to host on Vercel.

Live URL: [add after first deploy]
GitHub: [add repo URL]

---

## Core Concepts

### Alphabet
A named collection of glyphs created by the user. Users can maintain multiple alphabets
(e.g. "Elvish Draft", "Cipher Script"). Each alphabet is independent with its own glyphs
and mappings. Stored in localStorage and exportable as JSON.

### Glyph
A hand-drawn symbol created on a canvas. Stored as a base64 PNG data URL. A glyph belongs
to exactly one alphabet and maps to one or more IPA phonemes.

### Phoneme Mapping
Every glyph is ultimately mapped to one or more IPA phonemes — this is the single source
of truth for all phonetic operations. Users can arrive at this mapping two ways:
- **IPA mode** — browse IPA symbols directly by category, pick one
- **Character mode** — browse an existing writing system (Latin, Cyrillic, Arabic, Devanagari,
  Hebrew, Greek, Hangul, Hiragana, Katakana, Georgian, Armenian, Ethiopic, Runic), pick a
  character, then select from that character's known phonetic interpretations

In both modes, what gets stored is always IPA phonemes. The source character (e.g. "J") is
not stored — it is only a UI shortcut for finding the right phoneme(s).

---

## Data Model

```js
// Top-level app state
{
  alphabets: Alphabet[],
  activeAlphabetId: string
}

// Alphabet
{
  id: string,           // uuid
  name: string,         // user-defined e.g. "My Script"
  createdAt: number,    // timestamp
  glyphs: Glyph[]
}

// Glyph
{
  id: string,           // uuid
  alphabetId: string,
  imageData: string,    // base64 PNG data URL from canvas
  phonemes: string[],   // one or more IPA symbols e.g. ["dʒ"] or ["t", "ʃ"]
  label: string,        // display label, usually the primary phoneme e.g. "dʒ"
  createdAt: number     // timestamp
}
```

---

## App Structure

Four main screens, navigated via top-level tabs. Each tab has a container component
(e.g. `AlphabetBuilder.jsx`) that owns the layout and composes the sub-components.
`App.jsx` imports only the container — never the sub-components directly.

App.jsx also maintains some cross-tab persistent UI state so user selections survive
tab switches (e.g. which browse mode was active in the mapper, or the current lexicon).

### 1. Alphabet Builder
- Lists all alphabets as collapsible accordion sections — not limited to the active one
- Each section shows the glyph grid for that alphabet
- Clicking a glyph or "Add glyph" opens a **modal** (`DrawingModal.jsx`) containing the canvas
- Modal has stroke width control, undo, and clear; saving closes the modal
- No phoneme mapping happens here — just drawing and organizing
- No AlphabetSelector rendered here (alphabets are all shown inline)

### 2. Phoneme Mapper
- Assign phoneme(s) to each glyph in the active alphabet
- Compact AlphabetSelector at the top for switching alphabets
- Toggle at the top: "Browse by IPA" / "Browse by Character"
- Left panel: IPA browser or Character browser depending on toggle
  - IPA browser: symbols grouped by category and subcategory (Vowels › Close, etc.)
    with example word, audio button, and subcategory labels per symbol
  - Character browser: dropdown to pick writing system, then grid of characters
    each showing their known phonetic interpretations on hover/select
- Right panel: glyph grid for the active alphabet, click a glyph to assign the
  selected phoneme(s) to it
- Mapped glyphs show their assigned phoneme label as a badge
- The selected browse mode and selected writing system are lifted to App.jsx so they
  persist across tab switches

### 3. Lexicon Generator
- Generates a vocabulary using the active alphabet's phoneme inventory
- Language profile selector: pick a reference language (English, Spanish, Arabic,
  Japanese, Mandarin, Russian, Swahili, Hawaiian, Finnish) — determines phoneme
  weights, syllable templates, and consonant cluster rules
- Word count slider (10–150) and sample length slider (20–200 words) in the container
- Generate button produces a Zipf-distributed word list rendered in the user's glyphs
- **WordGrid** renders each generated word as glyphs with IPA below; opacity reflects frequency
- **TextSample** renders a sampled paragraph in three forms: script glyphs, IPA phonetic, and romanized
- Glyphs without drawings show raw IPA as fallback
- The word list, text sample, language selection, word count, and sample length are lifted
  to App.jsx so they persist across tab switches

### 4. Translator
- Translates English text into the user's script
- Text input area with a Translate button
- Converts English → IPA using CMU Pronouncing Dictionary with rule-based fallback
- Output renders each word in the user's glyphs with original word and IPA shown below
- Unmapped phonemes fall back to raw IPA symbols
- Alphabet can be switched via a switch-only AlphabetSelector at the top
- No external API calls — fully offline capable

---

## Persistence

### Auto-save
All alphabet data auto-saves to localStorage on every change via the `useAlphabet` hook.
Loads automatically on app start.

### Export
Two export operations:
- **Export active** — downloads a single `.conlang` file for the current alphabet
- **Export all** — downloads all alphabets as one `.conlang` file (used as a full backup)

`.conlang` files are JSON with a custom extension. They contain full glyph image data.

### Import
Reads a `.conlang` file and merges it into the current session. Skips any alphabet whose
ID already exists (no overwrites). Validates structure before loading. Switches to the first
imported alphabet on success.

### localStorage keys
- `conalpha_alphabets` — full array of all alphabets
- `conalpha_active_id` — the active alphabet ID, restored on next visit

---

## Component Structure

```
├── components/
│   ├── AlphabetBuilder/
│   │   ├── AlphabetBuilder.jsx    ← container, imported by App.jsx
│   │   ├── DrawingCanvas.jsx
│   │   ├── DrawingModal.jsx       ← modal wrapper around DrawingCanvas
│   │   └── GlyphLibrary.jsx
│   ├── PhonemeMapper/
│   │   ├── PhonemeMapper.jsx      ← container, imported by App.jsx
│   │   ├── IPABrowser.jsx
│   │   ├── CharacterBrowser.jsx
│   │   └── MappingPanel.jsx
│   ├── LexiconGenerator/
│   │   ├── LexiconGenerator.jsx   ← container, imported by App.jsx
│   │   ├── LanguageSelector.jsx
│   │   ├── WordGrid.jsx
│   │   └── TextSample.jsx         ← renders sampled paragraph in 3 forms
│   ├── Translator/
│   │   ├── Translator.jsx         ← container, imported by App.jsx
│   │   ├── TextInput.jsx
│   │   └── ScriptOutput.jsx
│   └── shared/
│       ├── AlphabetSelector.jsx
│       ├── GlyphRenderer.jsx
│       └── AudioButton.jsx
```

---

## Data Files Detail

### `src/data/ipa.js`
Array of IPA symbol objects. Exports `IPA_SYMBOLS` plus helpers.

```js
{
  symbol: "dʒ",
  category: "Affricates",
  subcategory: null,              // finer grouping within category (e.g. "Close" under Vowels)
  description: "judge",          // short English example word
  examples: [                    // structured examples for rich rendering
    { word: "judge", bold: "j" }
  ],
  audioFile: "dʒ.mp3",           // matches filename in public/audio/ipa/
  isVowel: false                 // used by lexicon generator for slot filtering
}
```

Exported helpers:
- `getIPAEntry(symbol)` — lookup by symbol
- `getSymbolsByCategory(category)` — filter by category
- `getSubcategories(category)` — list of subcategories in a category
- `getVowels()` — all entries where `isVowel === true`
- `getConsonants()` — all entries where `isVowel === false`

Categories: Vowels, Plosives, Nasals, Trills, Flaps, Fricatives, Affricates,
Approximants, Lateral Approximants, Clicks.

### `src/data/unicodeAlphabets.js`
Array of writing system objects. Exports `UNICODE_ALPHABETS` plus helpers.

```js
{
  id: "latin",
  name: "Latin",
  region: "Europe",
  characters: [
    { char: "J", phonemes: ["dʒ", "j", "ʒ", "x"], defaultPhoneme: "dʒ" },
    { char: "C", phonemes: ["k", "s", "tʃ"], defaultPhoneme: "k" },
    // ...
  ]
}
```

13 systems: latin, cyrillic, greek, arabic, hebrew, devanagari, georgian, armenian,
hiragana, hangul, ethiopic, runic, katakana.

Exported helpers:
- `getUnicodeAlphabetById(id)` — lookup by id

### `src/data/languageProfiles.js`
Array of language profile objects. Exports `LANGUAGE_PROFILES` plus helpers.

```js
{
  id: "english",
  name: "English",
  region: "Germanic",
  phonemeWeights: {
    "ə": 0.12, "n": 0.07, "t": 0.07, "s": 0.06
    // ... all phonemes with frequency weights
  },
  syllableTemplates: ["CV", "CVC", "CVC", "CVCV", "VC", "CVCC"],
  // templates listed with repetition to weight them by likelihood
  onsetClusterMode: "sonorant"  // "sonorant" = second onset C must be liquid/glide (bl, tr…)
                                // "free" = any consonant cluster allowed
}
```

9 profiles: english, spanish, arabic, japanese, mandarin, russian, swahili, hawaiian, finnish.

Exported helpers:
- `getLanguageProfile(id)` — lookup by id
- `getLanguageProfilesList()` — returns `{id, name, region}[]` for the selector UI
- `getFilteredPhonemeWeights(profile, availablePhonemes)` — redistributes weights to only
  the phonemes present in the user's alphabet, with a 30% floor for unmapped phonemes

---

## Hooks

### `useAlphabet`
Single source of truth for all alphabet state. Instantiated once in `App.jsx`. All children
receive state and operations as props — they do not access the hook directly.

Exposes:
- `alphabets`, `activeAlphabet`, `activeAlphabetId`
- `createAlphabet(name)`, `renameAlphabet(id, name)`, `deleteAlphabet(id)`, `switchActiveAlphabet(id)`
- `addGlyphToActiveAlphabet(imageData)`, `updateGlyphImage(glyphId, imageData)`,
  `updateGlyphPhonemes(glyphId, phonemes, label)`, `deleteGlyph(glyphId)`, `reorderGlyphs(alphabetId, glyphs)`
- `findGlyphByPhoneme(phoneme)` — searches active alphabet
- `findGlyphByPhonemeInAlphabet(alphabetId, phoneme)` — searches a specific alphabet
- `exportActiveAlphabet()`, `exportAllAlphabets()`, `importAlphabetFile(file)`

IDs are generated with `crypto.randomUUID()`, falling back to timestamp + random string.

### `useAudio`
Manages IPA audio playback. Used in PhonemeMapper screens.

Exposes:
- `playPhoneme(symbol)` — plays the local MP3 if available, otherwise speaks the
  `description` word via Web Speech API as a fallback
- `preloadPhonemes(symbols)` — warms the audio cache
- `clearAudioCache()`
- `isLoading` (boolean), `loadingSymbol` (string | null)

---

## Utilities

### `src/utils/lexiconGenerator.js`
- `generateLexicon(activeAlphabet, languageProfile, wordCount)` → `GeneratedWord[]`
- `sampleTextFromLexicon(wordList, targetWordCount)` → array of sentences (each is `GeneratedWord[]`)

Uses Zipf distribution, weighted phoneme sampling, onset cluster restrictions per language
profile, and geminates prevention (no consecutive identical phonemes).

`GeneratedWord` shape:
```js
{
  rank: number,
  phonemes: string[],
  frequencyWeight: number,    // 0–1, used for opacity
  relativeFrequency: number   // per-thousand, shown as a label
}
```

### `src/utils/phonetics.js`
- `convertTextToPhonemes(text)` → `{ original: string, phonemes: string[], approximate: boolean }[]`
- `convertWordToPhonemes(word)` — single-word helper
- `convertIPAToLatin(phonemes)` — romanizes IPA back to readable English-like text (used in TextSample)

Uses CMU Pronouncing Dictionary with rule-based grapheme-to-phoneme fallback covering 20+
multi-character patterns (tch→tʃ, ph→f, etc.).

### `src/utils/syllableTemplates.js`
Helpers for parsing and applying syllable structure templates used by the lexicon generator.

- `parseTemplate(template)` → `["consonant", "vowel", ...]`
- `pickTemplate(templates)` → weighted random pick
- `pickWordStructure(templates)` → multi-syllable word structure (1 syl=45%, 2=35%, 3=15%, 4=5%)
- `filterPhonemesForSlot(phonemes, slotType, isVowelFn)` — filters phoneme list by slot type

### `src/utils/persistence.js`
See the Persistence section above for full details.

---

## Audio

IPA audio samples stored in `public/audio/ipa/` as MP3 files. Filenames match the
`audioFile` field in `ipa.js` (e.g. `dʒ.mp3`). Files sourced from open-licensed IPA
recordings (e.g. Wikimedia Commons).

Played via HTML Audio elements through the `useAudio` hook. If a local file is missing,
the hook automatically falls back to the Web Speech API, speaking the symbol's `description`
word instead. This means the app is functional even before all audio files are present.

---

## Coding Conventions

- **Function names**: verb + noun, descriptive. `saveGlyphToAlphabet`, `loadAlphabetFromStorage`,
  `generateWeightedWord`, `playIPASound`. Avoid abbreviations.
- **Comments**: every function gets a one-line comment describing what it does and what it returns.
  Complex logic gets inline comments explaining the why, not the what.
- **Component props**: always destructured at the top of the function. PropTypes not required
  but prop names should be self-explanatory.
- **State**: kept as high as needed, no higher. Alphabet state lives in App.jsx via useAlphabet.
  Cross-tab UI state (mapper browse mode, lexicon output) also lives in App.jsx. Local UI state
  lives in the component that owns it.
- **No premature optimization**: write it readable first. Comment where performance
  improvements might be needed later rather than optimizing upfront.
- **File length**: if a file is getting long, that's a signal to split it. Aim for components
  under 200 lines, utils under 150 lines.

---

## Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: plain CSS with CSS variables for theming — no CSS framework
- **Phonetics**: `cmu-pronouncing-dictionary` npm package for English → IPA
- **No other external dependencies** unless genuinely necessary
- **Deployment**: Vercel (auto-deploy on push to main)

---

## Known Limitations / Future Work

- Audio samples need to be sourced and added to `public/audio/ipa/` manually (Web Speech API covers in the meantime)
- CMU dictionary covers English only — other source language translation not yet supported
- No cross-device sync (localStorage is per-browser by design for now)
- Shareable alphabet links (encode alphabet as URL param) would be a good v2 feature

---

## Container State and Prop Interfaces

### General conventions
- Sub-components receive only the props they actually need — never the whole alphabet object when a subset will do
- Callback props are named on + verb + noun — e.g. `onSave`, `onSelectPhoneme`, `onGenerate`
- Data props use plain descriptive nouns — e.g. `glyphs`, `selectedPhoneme`, `wordList`
- `AlphabetSelector` is rendered inside PhonemeMapper, LexiconGenerator, and Translator with
  `compact={true}`. In Translator it additionally gets `switchOnly={true}`. It is NOT rendered
  inside AlphabetBuilder (alphabets are shown as accordion sections there instead).

### AlphabetBuilder

Local state:
```
expandedIds: Set<string>     // which alphabet accordion sections are open
modalState: {
  open: boolean,
  alphabetId: string | null, // which alphabet the modal is editing a glyph in
  glyphId: string | null     // null = new glyph, string = editing existing glyph
}
```

Props passed to DrawingModal:
```
isOpen: boolean
initialImage: string | null        // base64 PNG of glyph being edited, null for new
onSave: (imageData: string) => void
onClose: () => void
```

Props passed to DrawingCanvas (rendered inside DrawingModal):
```
initialImage: string | null
onSave: (imageData: string) => void
onClear: () => void
```

Props passed to GlyphLibrary:
```
glyphs: Glyph[]
selectedGlyphId: string | null
onSelectGlyph: (glyphId: string) => void
onDeleteGlyph: (glyphId: string) => void
onReorderGlyphs: (glyphs: Glyph[]) => void
```

Receives from App.jsx: `alphabets`, `activeAlphabetId`, `onAddGlyph`, `onUpdateGlyphImage`,
`onDeleteGlyph`, `onReorderGlyphs`, `onExportAllAlphabets`, and the full alphabet management
callbacks (create, rename, delete, switch, import, export).

### PhonemeMapper

State lifted to App.jsx (persists across tab switches):
```
browseMode: "ipa" | "character"
writingSystemId: string | null
```

Local state:
```
selectedIPASymbols: string[]   // phoneme(s) staged for assignment
selectedGlyphId: string | null // which glyph in MappingPanel is being assigned to
```

Props passed to IPABrowser:
```
selectedSymbols: string[]
onSelectSymbol: (symbol: string) => void
onPlayPhoneme: (symbol: string) => void
```

Props passed to CharacterBrowser:
```
selectedAlphabetId: string | null
selectedSymbols: string[]
onSelectAlphabet: (alphabetId: string) => void
onSelectPhonemes: (phonemes: string[], label: string) => void
onPlayPhoneme: (symbol: string) => void
```

Props passed to MappingPanel:
```
glyphs: Glyph[]
selectedGlyphId: string | null
onSelectGlyph: (glyphId: string) => void
onAssignPhonemes: (glyphId: string, phonemes: string[], label: string) => void
```

Props passed to AlphabetSelector: full interface with `compact={true}`.

### LexiconGenerator

State lifted to App.jsx (persists across tab switches):
```
selectedLanguageId: string    // default "english"
wordCount: number             // default 40, range 10–150
sampleLength: number          // default 64, range 20–200 (target words in text sample)
wordList: GeneratedWord[]     // output of generateLexicon()
textSample: GeneratedWord[][] // output of sampleTextFromLexicon()
```

The Generate button and both sliders live in the container, not in sub-components.
Container calls `generateLexicon()` and `sampleTextFromLexicon()` and writes results
to the lifted state via callbacks from App.jsx.

Props passed to LanguageSelector:
```
selectedLanguageId: string
onSelectLanguage: (languageId: string) => void
```

Props passed to WordGrid:
```
wordList: GeneratedWord[]
glyphs: Glyph[]
findGlyphByPhoneme: (phoneme: string) => Glyph | null
```

Props passed to TextSample:
```
textSample: GeneratedWord[][]   // array of sentences, each sentence is array of words
glyphs: Glyph[]
findGlyphByPhoneme: (phoneme: string) => Glyph | null
```

### Translator

Local state:
```
inputText: string
translationResult: { original: string, phonemes: string[], approximate: boolean }[] | null
isTranslating: boolean
error: string | null
```

Props passed to TextInput:
```
value: string
onChange: (text: string) => void
onTranslate: () => void
isTranslating: boolean
```

Props passed to ScriptOutput:
```
translationResult: TranslationResult[] | null
findGlyphByPhoneme: (phoneme: string) => Glyph | null
showApproximateIndicator: boolean
```

Props passed to AlphabetSelector: full interface with `compact={true}` and `switchOnly={true}`.

### shared/AlphabetSelector

Renders a dropdown to switch alphabets. When `switchOnly={false}` (default), also shows
create/rename/delete buttons with confirmation on delete, and export/import buttons.
When `compact={true}`, hides the export/import buttons.
Manages no state itself — all actions fire callbacks to the container.

Props:
```
alphabets: Alphabet[]
activeAlphabetId: string
onSwitch: (alphabetId: string) => void
onCreate: (name: string) => void
onRename: (alphabetId: string, name: string) => void
onDelete: (alphabetId: string) => void
onExport: () => void
onImport: (file: File) => void
compact: boolean      // hides export/import buttons
switchOnly: boolean   // hides create/rename/delete, shows only the dropdown
```

### shared/GlyphRenderer

Renders a single glyph image or falls back to raw IPA text if no image exists.

```
glyph: Glyph | null
phoneme: string    // fallback label if glyph is null or has no image
size: number       // width and height in px, default 48
```

### shared/AudioButton

Play button for a single IPA sound. Used in IPABrowser and CharacterBrowser.

```
phoneme: string
onPlay: (phoneme: string) => void
isLoading: boolean
```
