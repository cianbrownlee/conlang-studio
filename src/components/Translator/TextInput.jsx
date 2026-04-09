// English text input area with a Translate button. Supports Ctrl/Cmd+Enter to translate.

export default function TextInput({ value, onChange, onTranslate, isTranslating }) {
  /** Allows Ctrl+Enter or Cmd+Enter as a keyboard shortcut for translation. */
  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isTranslating && value.trim()) onTranslate();
    }
  }

  return (
    <div className="text-input">
      <label className="text-input__label" htmlFor="translator-input">
        English text
      </label>
      <textarea
        id="translator-input"
        className="text-input__area"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type or paste English text here…"
        rows={5}
        spellCheck={false}
      />
      <div className="text-input__actions">
        <button
          className="button button--primary"
          onClick={onTranslate}
          disabled={isTranslating || !value.trim()}
        >
          {isTranslating ? "Translating…" : "Translate"}
        </button>
        <span className="text-input__shortcut-hint">or Ctrl+Enter</span>
      </div>
    </div>
  );
}
