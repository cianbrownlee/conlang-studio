// Dropdown to pick a reference language profile (English, Spanish, Arabic, etc.).

import { LANGUAGE_PROFILES } from "../../data/languageProfiles";

export default function LanguageSelector({ selectedLanguageId, onSelectLanguage }) {
  return (
    <div className="language-selector">
      <label className="language-selector__label" htmlFor="language-select">
        Language profile
      </label>
      <select
        id="language-select"
        className="language-selector__select"
        value={selectedLanguageId}
        onChange={(e) => onSelectLanguage(e.target.value)}
      >
        {LANGUAGE_PROFILES.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.name} — {profile.region}
          </option>
        ))}
      </select>
      <p className="language-selector__hint">
        Shapes the word sounds and syllable structure to feel like this language tradition.
      </p>
    </div>
  );
}
