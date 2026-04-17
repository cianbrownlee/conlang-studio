// Top-level tab navigation and global alphabet state via useAlphabet

/**
 * App.jsx
 * The top-level shell of ConAlpha. Responsible for:
 *   - Instantiating the useAlphabet hook (single source of truth for all alphabet state)
 *   - Rendering the top navigation tabs
 *   - Rendering the active screen based on the selected tab
 *   - Passing alphabet state and operations down to each screen
 *
 * This is the only place useAlphabet is instantiated. All child components
 * receive alphabet data and operations as props — they do not manage their own
 * alphabet state.
 *
 * To add a new top-level screen in the future:
 *   1. Add an entry to the TABS array below
 *   2. Import the new screen component
 *   3. Add a case for it in renderActiveScreen()
 */

import { useState } from "react";
import { useAlphabet } from "./hooks/useAlphabet";
import AlphabetBuilderScreen from "./components/AlphabetBuilder/AlphabetBuilder";
import PhonemMapperScreen from "./components/PhonemeMapper/PhonemeMapper";
import LexiconGeneratorScreen from "./components/LexiconGenerator/LexiconGenerator";
import TranslatorScreen from "./components/Translator/Translator";
import ExportModal from "./components/shared/ExportModal";
import "./App.css";

// ---------------------------------------------------------------------------
// TAB DEFINITIONS
// Add new top-level screens here. Order determines display order in the nav.
// ---------------------------------------------------------------------------

const TABS = [
  {
    id: "builder",
    label: "Alphabet Builder",
    description: "Draw and organize your glyphs",
  },
  {
    id: "mapper",
    label: "Phoneme Mapper",
    description: "Assign sounds to your glyphs",
  },
  {
    id: "lexicon",
    label: "Lexicon Generator",
    description: "Generate words in your script",
  },
  {
    id: "translator",
    label: "Translator",
    description: "Render English text in your script",
  },
];

// ---------------------------------------------------------------------------
// APP
// ---------------------------------------------------------------------------

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState("builder");

  // Cross-tab persistent UI state — lives here so it survives tab switches
  const [mapperBrowseMode, setMapperBrowseMode] = useState("character");
  const [mapperWritingSystemId, setMapperWritingSystemId] = useState(null);
  const [lexiconLanguageId, setLexiconLanguageId] = useState("english");
  const [lexiconWordCount, setLexiconWordCount] = useState(40);
  const [lexiconSampleLength, setLexiconSampleLength] = useState(64);
  const [lexiconWordList, setLexiconWordList] = useState([]);
  const [lexiconTextSample, setLexiconTextSample] = useState([]);

  // Export modal — `alphabets` is the set to export, `title` is the modal heading.
  const [exportModal, setExportModal] = useState({ open: false, alphabets: [], title: "" });

  /** Opens the export modal with the given alphabets and heading. */
  function openExportModal(alphabetsToExport, title) {
    setExportModal({ open: true, alphabets: alphabetsToExport, title });
  }

  /** Closes the export modal (preserves payload so the close animation, if any, has data). */
  function closeExportModal() {
    setExportModal((prev) => ({ ...prev, open: false }));
  }

  // All alphabet state and operations come from this single hook instance.
  // Everything below receives what it needs as props.
  const alphabetHook = useAlphabet();

  /** Opens the modal for exporting every alphabet in one file. */
  function openExportAll() {
    openExportModal(
      alphabetHook.alphabets,
      `Export all alphabets (${alphabetHook.alphabets.length})`
    );
  }

  // ---------------------------------------------------------------------------
  // SCREEN ROUTER
  // Renders the correct screen component based on the active tab.
  // Each screen receives only the props it actually needs.
  // ---------------------------------------------------------------------------

  function renderActiveScreen() {
    // Props shared by all screens that need alphabet access
    const sharedAlphabetProps = {
      alphabets: alphabetHook.alphabets,
      activeAlphabet: alphabetHook.activeAlphabet,
      activeAlphabetId: alphabetHook.activeAlphabetId,
      onSwitchAlphabet: alphabetHook.switchActiveAlphabet,
      onCreateAlphabet: alphabetHook.createAlphabet,
      onRenameAlphabet: alphabetHook.renameAlphabet,
      onDeleteAlphabet: alphabetHook.deleteAlphabet,
      onExportActiveAlphabet: () => {
        const active = alphabetHook.activeAlphabet;
        if (active) openExportModal([active], `Export "${active.name}"`);
      },
      onExportAlphabet: (alphabet) => {
        openExportModal([alphabet], `Export "${alphabet.name}"`);
      },
      onImportAlphabetFile: alphabetHook.importAlphabetFile,
    };

    switch (activeTab) {
      case "builder":
        return (
          <AlphabetBuilderScreen
            {...sharedAlphabetProps}
            onAddGlyph={alphabetHook.addGlyphToActiveAlphabet}
            onUpdateGlyphImage={alphabetHook.updateGlyphImage}
            onDeleteGlyph={alphabetHook.deleteGlyph}
            onReorderGlyphs={alphabetHook.reorderGlyphs}
          />
        );

      case "mapper":
        return (
          <PhonemMapperScreen
            {...sharedAlphabetProps}
            onUpdateGlyphPhonemes={alphabetHook.updateGlyphPhonemes}
            onReorderGlyphs={alphabetHook.reorderGlyphs}
            browseMode={mapperBrowseMode}
            onChangeBrowseMode={setMapperBrowseMode}
            writingSystemId={mapperWritingSystemId}
            onChangeWritingSystemId={setMapperWritingSystemId}
          />
        );

      case "lexicon":
        return (
          <LexiconGeneratorScreen
            {...sharedAlphabetProps}
            findGlyphByPhoneme={alphabetHook.findGlyphByPhoneme}
            selectedLanguageId={lexiconLanguageId}
            onSelectLanguage={setLexiconLanguageId}
            wordCount={lexiconWordCount}
            onChangeWordCount={setLexiconWordCount}
            sampleLength={lexiconSampleLength}
            onChangeSampleLength={setLexiconSampleLength}
            wordList={lexiconWordList}
            onChangeWordList={setLexiconWordList}
            textSample={lexiconTextSample}
            onChangeTextSample={setLexiconTextSample}
          />
        );

      case "translator":
        return (
          <TranslatorScreen
            {...sharedAlphabetProps}
            findGlyphByPhoneme={alphabetHook.findGlyphByPhoneme}
          />
        );

      default:
        return null;
    }
  }

  // ---------------------------------------------------------------------------
  // EMPTY STATE
  // Shown on first visit before any alphabets exist.
  // ---------------------------------------------------------------------------

  function renderEmptyState() {
    return (
      <div className="empty-state">
        <h2 className="empty-state__heading">Welcome to ConAlpha</h2>
        <p className="empty-state__body">
          Create your first alphabet to get started. You can draw your own glyphs,
          map them to phonetic sounds, generate words, and translate text into your
          custom script.
        </p>
        <button
          className="button button--primary"
          onClick={() => {
            const name = prompt("Name your alphabet (e.g. Runic, Dwarven, Elvish):");
            if (name) {
              alphabetHook.createAlphabet(name);
            }
          }}
        >
          Create your first alphabet
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  const hasAlphabets = alphabetHook.alphabets.length > 0;

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="app__header">
        <div className="app__header-inner">
          <div className="app__wordmark">
            <h1 className="app__title">ConAlpha</h1>
            <p className="app__subtitle">Build · Map · Generate · Translate</p>
          </div>

          {/* Import/export controls, always visible */}
          <div className="app__header-actions">
            <label className="button button--ghost" title="Load a .conlang file">
              Import
              <input
                type="file"
                accept=".conlang"
                className="visually-hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  try {
                    const message = await alphabetHook.importAlphabetFile(file);
                    alert(message);
                  } catch (error) {
                    alert(`Import failed: ${error.message}`);
                  }
                  // Reset the input so the same file can be imported again if needed
                  e.target.value = "";
                }}
              />
            </label>

            {hasAlphabets && (
              <button
                className="button button--ghost"
                onClick={openExportAll}
                title="Save all alphabets as a .conlang file"
              >
                Export all
              </button>
            )}
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        {hasAlphabets && (
          <nav className="app__nav" aria-label="Main navigation">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`app__nav-tab ${activeTab === tab.id ? "app__nav-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? "page" : undefined}
                title={tab.description}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* ── Main Content ── */}
      <main className="app__main">
        {hasAlphabets ? renderActiveScreen() : renderEmptyState()}
      </main>

      {/* ── Export Modal ── */}
      <ExportModal
        isOpen={exportModal.open}
        onClose={closeExportModal}
        alphabets={exportModal.alphabets}
        title={exportModal.title}
      />

    </div>
  );
}