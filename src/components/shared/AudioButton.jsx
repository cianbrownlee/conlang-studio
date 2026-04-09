// Play button for a single IPA audio sample. Used in IPABrowser and CharacterBrowser.

export default function AudioButton({ phoneme, onPlay, isLoading }) {
  return (
    <button
      className={`audio-button${isLoading ? " audio-button--loading" : ""}`}
      onClick={() => onPlay(phoneme)}
      disabled={isLoading}
      title={`Play /${phoneme}/`}
      aria-label={`Play sound for /${phoneme}/`}
    >
      {isLoading ? "…" : "▶"}
    </button>
  );
}
