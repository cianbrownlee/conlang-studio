// Reusable dropdown for creating, renaming, deleting, and switching alphabets.
// Manages no local state — all actions fire callbacks to the container.

import { useRef } from "react";

export default function AlphabetSelector({
  alphabets,
  activeAlphabetId,
  onSwitch,
  onCreate,
  onRename,
  onDelete,
  onExport,
  onImport,
}) {
  const importInputRef = useRef(null);
  const activeAlphabet = alphabets.find((a) => a.id === activeAlphabetId) ?? null;

  /** Prompts for a name and fires onCreate. */
  function handleCreate() {
    const name = prompt("Name your new alphabet (e.g. Elvish, Runic, Cipher):");
    if (name && name.trim()) onCreate(name.trim());
  }

  /** Prompts for a new name and fires onRename. */
  function handleRename() {
    if (!activeAlphabet) return;
    const name = prompt("Rename alphabet:", activeAlphabet.name);
    if (name && name.trim()) onRename(activeAlphabetId, name.trim());
  }

  /** Asks for confirmation before firing onDelete. */
  function handleDelete() {
    if (!activeAlphabet) return;
    if (window.confirm(`Delete "${activeAlphabet.name}"? This cannot be undone.`)) {
      onDelete(activeAlphabetId);
    }
  }

  /** Reads the selected file and fires onImport, then resets the input. */
  function handleImportChange(e) {
    const file = e.target.files[0];
    if (file) onImport(file);
    e.target.value = "";
  }

  return (
    <div className="alphabet-selector">
      <div className="alphabet-selector__main-row">
        <select
          className="alphabet-selector__dropdown"
          value={activeAlphabetId ?? ""}
          onChange={(e) => onSwitch(e.target.value)}
          aria-label="Active alphabet"
        >
          {alphabets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <button
          className="button button--icon"
          onClick={handleCreate}
          title="New alphabet"
          aria-label="Create new alphabet"
        >
          +
        </button>
        <button
          className="button button--icon"
          onClick={handleRename}
          disabled={!activeAlphabet}
          title="Rename active alphabet"
          aria-label="Rename active alphabet"
        >
          ✎
        </button>
        <button
          className="button button--icon button--danger"
          onClick={handleDelete}
          disabled={!activeAlphabet}
          title="Delete active alphabet"
          aria-label="Delete active alphabet"
        >
          ✕
        </button>
      </div>

      <div className="alphabet-selector__file-row">
        <button
          className="button button--ghost"
          onClick={onExport}
          disabled={!activeAlphabet}
          title="Download active alphabet as a .conlang file"
        >
          Export
        </button>

        <label className="button button--ghost" title="Load a .conlang file">
          Import
          <input
            ref={importInputRef}
            type="file"
            accept=".conlang"
            className="visually-hidden"
            onChange={handleImportChange}
          />
        </label>
      </div>
    </div>
  );
}
