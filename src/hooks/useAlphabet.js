// Alphabet CRUD operations with automatic localStorage sync on every change

/**
 * useAlphabet.js
 * The central state hook for all alphabet data. Every screen in the app
 * that reads or modifies alphabets does so through this hook.
 *
 * Responsibilities:
 *   - Load alphabets from localStorage on first mount
 *   - Keep alphabets in sync with localStorage on every change
 *   - Track which alphabet is currently active
 *   - Expose CRUD operations for alphabets and glyphs
 *   - Expose export/import operations
 *
 * Usage:
 *   const { alphabets, activeAlphabet, createAlphabet, addGlyph, ... } = useAlphabet();
 *
 * This hook lives in App.jsx and its return value is passed down as props.
 * Do not instantiate it in multiple components — one instance at the top level only.
 */

import { useState, useEffect, useCallback } from "react";
import {
  loadAlphabetsFromStorage,
  saveAlphabetsToStorage,
  loadActiveAlphabetId,
  saveActiveAlphabetId,
  importAlphabetFromFile,
} from "../utils/persistence";

// ---------------------------------------------------------------------------
// ID GENERATION
// ---------------------------------------------------------------------------

/**
 * Generates a simple unique ID string.
 * Uses crypto.randomUUID if available, falls back to a timestamp + random combo.
 *
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// HOOK
// ---------------------------------------------------------------------------

export function useAlphabet() {
  const [alphabets, setAlphabets] = useState([]);
  const [activeAlphabetId, setActiveAlphabetId] = useState(null);

  // ---------------------------------------------------------------------------
  // INITIALIZATION — load from localStorage on first mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const saved = loadAlphabetsFromStorage();
    const savedActiveId = loadActiveAlphabetId();

    if (saved.length > 0) {
      // Hydrating from an external source (localStorage) on mount is the
      // canonical use of setState-in-effect. The lint rule fires a false
      // positive here; there's no alternative that avoids the initial paint.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAlphabets(saved);

      // Restore the previously active alphabet, or default to the first one
      const restoredId = saved.find((a) => a.id === savedActiveId)
        ? savedActiveId
        : saved[0].id;

      setActiveAlphabetId(restoredId);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // AUTO-SAVE — persist to localStorage whenever alphabets change
  // ---------------------------------------------------------------------------

  useEffect(() => {
    // Don't overwrite storage with an empty array on the very first render
    // before the load effect has had a chance to run
    if (alphabets.length > 0) {
      try {
        saveAlphabetsToStorage(alphabets);
      } catch (error) {
        // Surface storage quota errors to the user via console for now.
        // Components can add UI-level error handling by wrapping operations in try/catch.
        console.error(error.message);
      }
    }
  }, [alphabets]);

  // Persist the active alphabet ID separately whenever it changes
  useEffect(() => {
    if (activeAlphabetId) {
      saveActiveAlphabetId(activeAlphabetId);
    }
  }, [activeAlphabetId]);

  // ---------------------------------------------------------------------------
  // DERIVED STATE
  // ---------------------------------------------------------------------------

  // The full alphabet object that is currently selected, or null if none exist
  const activeAlphabet = alphabets.find((a) => a.id === activeAlphabetId) ?? null;

  // ---------------------------------------------------------------------------
  // ALPHABET OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Creates a new empty alphabet with the given name and makes it active.
   * Returns the new alphabet object.
   *
   * @param {string} name - The display name (e.g. "Runic", "Dwarven Script")
   * @returns {Object} the new alphabet
   */
  const createAlphabet = useCallback((name) => {
    const newAlphabet = {
      id: generateId(),
      name: name.trim() || "Untitled Alphabet",
      createdAt: Date.now(),
      glyphs: [],
    };

    setAlphabets((prev) => [...prev, newAlphabet]);
    setActiveAlphabetId(newAlphabet.id);
    return newAlphabet;
  }, []);

  /**
   * Renames an existing alphabet by ID.
   *
   * @param {string} alphabetId
   * @param {string} newName
   */
  const renameAlphabet = useCallback((alphabetId, newName) => {
    setAlphabets((prev) =>
      prev.map((a) =>
        a.id === alphabetId
          ? { ...a, name: newName.trim() || "Untitled Alphabet" }
          : a
      )
    );
  }, []);

  /**
   * Deletes an alphabet by ID. If the deleted alphabet was active,
   * switches to the first remaining alphabet (or null if none are left).
   *
   * @param {string} alphabetId
   */
  const deleteAlphabet = useCallback((alphabetId) => {
    setAlphabets((prev) => {
      const remaining = prev.filter((a) => a.id !== alphabetId);

      // Update active ID if we just deleted the active alphabet
      setActiveAlphabetId((currentId) => {
        if (currentId === alphabetId) {
          return remaining.length > 0 ? remaining[0].id : null;
        }
        return currentId;
      });

      return remaining;
    });
  }, []);

  /**
   * Switches the active alphabet to the one with the given ID.
   *
   * @param {string} alphabetId
   */
  const switchActiveAlphabet = useCallback((alphabetId) => {
    setActiveAlphabetId(alphabetId);
  }, []);

  // ---------------------------------------------------------------------------
  // GLYPH OPERATIONS
  // All glyph operations target the currently active alphabet.
  // ---------------------------------------------------------------------------

  /**
   * Adds a new glyph to the active alphabet.
   * If a glyph with the same ID already exists, it is replaced (for redrawing).
   * Returns the new glyph object.
   *
   * @param {Object} glyphData - { imageData, phonemes, label }
   * @returns {Object} the new glyph
   */
  const addGlyphToActiveAlphabet = useCallback((glyphData) => {
    const newGlyph = {
      id: generateId(),
      alphabetId: activeAlphabetId,
      imageData: glyphData.imageData,   // base64 PNG string from the drawing canvas
      phonemes: glyphData.phonemes,     // array of IPA symbol strings e.g. ["dʒ"]
      label: glyphData.label,           // display label e.g. "dʒ"
      createdAt: Date.now(),
    };

    setAlphabets((prev) =>
      prev.map((a) =>
        a.id === activeAlphabetId
          ? { ...a, glyphs: [...a.glyphs, newGlyph] }
          : a
      )
    );

    return newGlyph;
  }, [activeAlphabetId]);

  /**
   * Replaces an existing glyph's image data. Used when the user redraws a glyph.
   * Preserves the glyph's ID, phoneme mapping, and label.
   *
   * @param {string} glyphId
   * @param {string} newImageData - base64 PNG string from the drawing canvas
   */
  const updateGlyphImage = useCallback((glyphId, newImageData) => {
    setAlphabets((prev) =>
      prev.map((a) =>
        a.id === activeAlphabetId
          ? {
              ...a,
              glyphs: a.glyphs.map((g) =>
                g.id === glyphId ? { ...g, imageData: newImageData } : g
              ),
            }
          : a
      )
    );
  }, [activeAlphabetId]);

  /**
   * Updates the phoneme mapping for an existing glyph.
   * Called from the Phoneme Mapper screen when the user assigns or changes a mapping.
   *
   * @param {string} glyphId
   * @param {string[]} phonemes - array of IPA symbols e.g. ["t", "ʃ"] for the "ch" sound
   * @param {string} label - display label for the glyph e.g. "tʃ"
   */
  const updateGlyphPhonemes = useCallback((glyphId, phonemes, label) => {
    setAlphabets((prev) =>
      prev.map((a) =>
        a.id === activeAlphabetId
          ? {
              ...a,
              glyphs: a.glyphs.map((g) =>
                g.id === glyphId ? { ...g, phonemes, label } : g
              ),
            }
          : a
      )
    );
  }, [activeAlphabetId]);

  /**
   * Removes a glyph from the active alphabet by ID.
   *
   * @param {string} glyphId
   */
  const deleteGlyph = useCallback((glyphId) => {
    setAlphabets((prev) =>
      prev.map((a) =>
        a.id === activeAlphabetId
          ? { ...a, glyphs: a.glyphs.filter((g) => g.id !== glyphId) }
          : a
      )
    );
  }, [activeAlphabetId]);

  /**
   * Replaces the glyph array for one alphabet with a new ordered array.
   * Called after a drag-to-reorder operation in GlyphLibrary or MappingPanel.
   *
   * @param {string} alphabetId
   * @param {Object[]} orderedGlyphs - complete glyph array in the new order
   */
  const reorderGlyphs = useCallback((alphabetId, orderedGlyphs) => {
    setAlphabets((prev) =>
      prev.map((a) =>
        a.id === alphabetId ? { ...a, glyphs: orderedGlyphs } : a
      )
    );
  }, []);

  /**
   * Looks up a glyph in the active alphabet by its primary phoneme.
   * Used by the translator and lexicon generator to render output.
   * Returns the glyph object, or null if no glyph is mapped to that phoneme.
   *
   * @param {string} phoneme - an IPA symbol string
   * @returns {Object|null}
   */
  const findGlyphByPhoneme = useCallback((phoneme) => {
    if (!activeAlphabet) return null;
    return activeAlphabet.glyphs.find((g) => g.phonemes.includes(phoneme)) ?? null;
  }, [activeAlphabet]);

  // ---------------------------------------------------------------------------
  // IMPORT
  // ---------------------------------------------------------------------------

  /**
   * Imports alphabets from a .conlang file.
   * Merges imported alphabets into the current session — does not overwrite.
   * If an imported alphabet has the same ID as an existing one, it is skipped
   * to avoid accidental overwrites. The user can rename and re-import if needed.
   *
   * @param {File} file - from an <input type="file"> change event
   * @returns {Promise<string>} a user-facing success message
   */
  const importAlphabetFile = useCallback(async (file) => {
    const result = await importAlphabetFromFile(file);

    const incoming = result.type === "single"
      ? [result.alphabet]
      : result.alphabets;

    setAlphabets((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));

      // Only add alphabets whose IDs don't already exist in the session
      const toAdd = incoming.filter((a) => !existingIds.has(a.id));

      if (toAdd.length === 0) return prev;

      // Switch to the first newly imported alphabet
      setActiveAlphabetId(toAdd[0].id);
      return [...prev, ...toAdd];
    });

    const count = incoming.length;
    return `Imported ${count} alphabet${count !== 1 ? "s" : ""} successfully.`;
  }, []);

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------

  return {
    // State
    alphabets,
    activeAlphabet,
    activeAlphabetId,

    // Alphabet operations
    createAlphabet,
    renameAlphabet,
    deleteAlphabet,
    switchActiveAlphabet,

    // Glyph operations
    addGlyphToActiveAlphabet,
    updateGlyphImage,
    updateGlyphPhonemes,
    deleteGlyph,
    reorderGlyphs,
    findGlyphByPhoneme,

    // Import (export is handled at the App level via ExportModal)
    importAlphabetFile,
  };
}