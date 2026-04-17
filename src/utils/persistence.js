// localStorage read/write, JSON export to .conlang file, and import with validation

/**
 * persistence.js
 * Handles all reading and writing of alphabet data — both to localStorage
 * for automatic session persistence, and to/from .conlang JSON files for
 * manual save/load by the user.
 *
 * Nothing in this file knows about React state. It only deals with raw data
 * and browser APIs. The useAlphabet hook is the only thing that should call
 * these functions.
 */

// The key used for all localStorage reads and writes.
const STORAGE_KEY = "conalpha_alphabets";

// The key used to remember which alphabet was active when the user left.
const ACTIVE_ID_KEY = "conalpha_active_id";

// The file extension used for exported alphabet files.
const FILE_EXTENSION = ".conlang";

// The version number embedded in exported files.
// Increment this if the data format changes in a breaking way.
const FORMAT_VERSION = 1;

// ---------------------------------------------------------------------------
// LOCALSTORAGE
// ---------------------------------------------------------------------------

/**
 * Loads all alphabets from localStorage.
 * Returns an empty array if nothing has been saved yet.
 */
export function loadAlphabetsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to load alphabets from localStorage:", error);
    return [];
  }
}

/**
 * Saves the full array of alphabets to localStorage.
 * Called automatically by useAlphabet on every state change.
 */
export function saveAlphabetsToStorage(alphabets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alphabets));
  } catch (error) {
    // localStorage can fail if storage quota is exceeded (lots of glyph image data)
    console.error("Failed to save alphabets to localStorage:", error);
    throw new Error(
      "Could not save your alphabet. Your browser storage may be full. Try exporting your alphabet as a file to keep your work safe."
    );
  }
}

/**
 * Loads the ID of the last active alphabet from localStorage.
 * Returns null if none was saved.
 */
export function loadActiveAlphabetId() {
  try {
    return localStorage.getItem(ACTIVE_ID_KEY);
  } catch (error) {
    console.error("Failed to load active alphabet ID:", error);
    return null;
  }
}

/**
 * Saves the active alphabet ID to localStorage so the user returns
 * to the same alphabet on their next visit.
 */
export function saveActiveAlphabetId(id) {
  try {
    localStorage.setItem(ACTIVE_ID_KEY, id);
  } catch (error) {
    console.error("Failed to save active alphabet ID:", error);
  }
}

/**
 * Wipes all ConAlpha data from localStorage.
 * Used for a full reset. Not exposed in the UI by default — add with care.
 */
export function clearAllStorage() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACTIVE_ID_KEY);
}

// ---------------------------------------------------------------------------
// FILE EXPORT
// ---------------------------------------------------------------------------

/**
 * Builds the JSON payload object that's written to an export file.
 * A one-alphabet array produces a `{ ...base, alphabet }` shape;
 * a multi-alphabet array produces `{ ...base, alphabets }`.
 *
 * @param {Array} alphabets - alphabets to include in the payload
 * @returns {Object}
 */
export function buildExportPayload(alphabets) {
  const base = { formatVersion: FORMAT_VERSION, exportedAt: new Date().toISOString() };
  return alphabets.length === 1
    ? { ...base, alphabet: alphabets[0] }
    : { ...base, alphabets };
}

/**
 * Triggers a browser download of a JSON payload under the given filename.
 * Caller is responsible for choosing the extension (.conlang, .json, etc.).
 *
 * @param {Object} payload - any JSON-serialisable value
 * @param {string} filename - filename including extension
 */
export function triggerJSONDownload(payload, filename) {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Release the object URL after a short delay to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Re-export the default extension so callers can build filenames consistently.
export const CONLANG_FILE_EXTENSION = FILE_EXTENSION;

// ---------------------------------------------------------------------------
// FILE IMPORT
// ---------------------------------------------------------------------------

/**
 * Reads a .conlang file selected by the user and returns the parsed alphabet
 * or array of alphabets it contains.
 *
 * Returns a promise that resolves to:
 *   { type: "single", alphabet } or { type: "multiple", alphabets }
 *
 * Rejects with a descriptive error message if the file is invalid.
 *
 * @param {File} file - A File object from an <input type="file"> element
 * @returns {Promise<Object>}
 */
export function importAlphabetFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided."));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const validated = validateImportedFile(parsed);
        resolve(validated);
      } catch {
        reject(new Error("This file could not be read. Make sure it is a valid .conlang file."));
      }
    };

    reader.onerror = () => {
      reject(new Error("The file could not be opened."));
    };

    reader.readAsText(file);
  });
}

// ---------------------------------------------------------------------------
// VALIDATION
// ---------------------------------------------------------------------------

/**
 * Validates the structure of an imported file and returns a normalized result.
 * Throws a descriptive error if validation fails.
 *
 * @param {Object} parsed - The raw parsed JSON from a .conlang file
 * @returns {{ type: string, alphabet?: Object, alphabets?: Array }}
 */
function validateImportedFile(parsed) {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("File is not valid JSON.");
  }

  if (!parsed.formatVersion) {
    throw new Error("File is missing a format version. It may be from an incompatible version of ConAlpha.");
  }

  // Single alphabet export
  if (parsed.alphabet) {
    validateAlphabet(parsed.alphabet);
    return { type: "single", alphabet: parsed.alphabet };
  }

  // Multi-alphabet export
  if (Array.isArray(parsed.alphabets)) {
    parsed.alphabets.forEach(validateAlphabet);
    return { type: "multiple", alphabets: parsed.alphabets };
  }

  throw new Error("File does not contain any alphabet data.");
}

/**
 * Validates that a single alphabet object has the required fields.
 * Throws a descriptive error if anything is missing or malformed.
 *
 * @param {Object} alphabet - The alphabet object to validate
 */
function validateAlphabet(alphabet) {
  if (!alphabet.id || typeof alphabet.id !== "string") {
    throw new Error("Alphabet is missing a valid ID.");
  }
  if (!alphabet.name || typeof alphabet.name !== "string") {
    throw new Error("Alphabet is missing a name.");
  }
  if (!Array.isArray(alphabet.glyphs)) {
    throw new Error(`Alphabet "${alphabet.name}" has invalid glyph data.`);
  }

  alphabet.glyphs.forEach((glyph, index) => {
    if (!glyph.id) throw new Error(`Glyph at index ${index} is missing an ID.`);
    if (!glyph.imageData) throw new Error(`Glyph at index ${index} is missing image data.`);
    if (!Array.isArray(glyph.phonemes)) throw new Error(`Glyph at index ${index} has invalid phoneme data.`);
  });
}

// ---------------------------------------------------------------------------
// UTILITIES
// ---------------------------------------------------------------------------

/**
 * Converts an alphabet name into a safe filename by removing characters
 * that are invalid in filenames across Windows, Mac, and Linux.
 *
 * @param {string} name - The raw alphabet name (may be null/empty)
 * @returns {string} - A safe filename string (without extension)
 */
export function sanitizeFilename(name) {
  if (!name) return "my_alphabet";
  return (
    name
      // Control chars are intentional — they're invalid in filenames and must be stripped.
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "") // remove invalid characters
      .replace(/\s+/g, "_")                    // replace spaces with underscores
      .replace(/^\.+/, "")                     // remove leading dots
      .slice(0, 64)                            // cap length
      || "my_alphabet"                         // fallback if name is empty after sanitizing
  );
}