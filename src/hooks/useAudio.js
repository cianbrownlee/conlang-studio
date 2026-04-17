// Loads and plays IPA audio samples from public/audio/ipa/ via Web Audio API

/**
 * useAudio.js
 * Hook for playing IPA audio samples from public/audio/ipa/.
 * Audio files are loaded on demand and cached so they don't reload on
 * every play. Uses HTML Audio elements — no Web Speech API for primary playback.
 *
 * Fallback: if the local audio file is missing (not yet sourced), falls back
 * to the Web Speech API speaking the phoneme's description word (e.g. "judge"
 * for /dʒ/). This gives useful audio feedback until real recordings are added.
 * Once a file exists at public/audio/ipa/<symbol>.mp3, it takes priority.
 *
 * Usage:
 *   const { playPhoneme, isLoading, loadingSymbol } = useAudio();
 *   playPhoneme("dʒ"); // plays public/audio/ipa/dʒ.mp3, or speaks "judge"
 */

import { useState, useRef, useCallback } from "react";
import { getIPAEntry } from "../data/ipa";

// Base path for all IPA audio files
const AUDIO_BASE_PATH = "/audio/ipa/";

export function useAudio() {
  // Cache of loaded Audio objects keyed by IPA symbol
  // useRef so the cache persists across renders without causing re-renders
  const audioCache = useRef({});

  // Tracks which symbol is currently loading (for UI feedback)
  const [loadingSymbol, setLoadingSymbol] = useState(null);

  /**
   * Returns the audio file path for a given IPA symbol.
   * Looks up the audioFile field from the IPA dataset.
   * Returns null if the symbol is not found in the dataset.
   *
   * @param {string} symbol - IPA symbol e.g. "dʒ"
   * @returns {string|null}
   */
  function getAudioPath(symbol) {
    const entry = getIPAEntry(symbol);
    if (!entry || !entry.audioFile) return null;
    return AUDIO_BASE_PATH + entry.audioFile;
  }

  /**
   * Loads an Audio object for a given IPA symbol, using the cache if available.
   * Returns a promise that resolves to the Audio element, or null if the file
   * doesn't exist or can't be loaded.
   *
   * Wrapped in useCallback so callers (playPhoneme / preloadPhonemes) can
   * include it in their dep arrays without churning on every render. Only
   * touches refs and pure module-level helpers, so empty deps are safe.
   *
   * @param {string} symbol
   * @returns {Promise<HTMLAudioElement|null>}
   */
  const loadAudio = useCallback(async (symbol) => {
    // Return cached version if available
    if (audioCache.current[symbol]) {
      return audioCache.current[symbol];
    }

    const path = getAudioPath(symbol);
    if (!path) return null;

    return new Promise((resolve) => {
      const audio = new Audio(path);

      audio.addEventListener("canplaythrough", () => {
        audioCache.current[symbol] = audio;
        resolve(audio);
      }, { once: true });

      audio.addEventListener("error", () => {
        // File not found or not yet sourced
        resolve(null);
      }, { once: true });

      audio.load();
    });
  }, []);

  /**
   * Fallback: uses the Web Speech API to speak the phoneme's description word
   * (e.g. "judge" for /dʒ/) when the local audio file isn't available yet.
   * This is removed automatically once the real file exists.
   *
   * @param {string} symbol
   */
  function speakFallback(symbol) {
    if (!window.speechSynthesis) return;
    const entry = getIPAEntry(symbol);
    if (!entry) return;
    // Speak the first example word — this is exactly what the IPABrowser shows
    // on screen first, so what you hear matches what you read.
    // Fall back to description if no examples exist.
    const word = entry.examples?.[0]?.word ?? entry.description;
    if (!word) return;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.85;
    utterance.lang = "en-US";
    window.speechSynthesis.cancel(); // stop anything already speaking
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Plays the audio sample for a given IPA symbol.
   * Tries the local recorded file first; falls back to Web Speech API if the
   * file isn't found. Does nothing if neither is available.
   *
   * @param {string} symbol - IPA symbol to play
   */
  const playPhoneme = useCallback(async (symbol) => {
    setLoadingSymbol(symbol);

    try {
      const audio = await loadAudio(symbol);

      if (!audio) {
        // Local file not available yet — use speech fallback
        speakFallback(symbol);
        return;
      }

      // Reset to start in case it was already played
      audio.currentTime = 0;
      await audio.play();
    } catch (error) {
      // Play can fail if the user hasn't interacted with the page yet
      // (browser autoplay policy) — fail silently
      console.warn(`Could not play audio for /${symbol}/`, error.message);
    } finally {
      setLoadingSymbol(null);
    }
  }, [loadAudio]);

  /**
   * Preloads audio files for a list of IPA symbols.
   * Call this when the IPA browser mounts to warm the cache for common symbols.
   * Non-blocking — loads in the background.
   *
   * @param {string[]} symbols
   */
  const preloadPhonemes = useCallback((symbols) => {
    symbols.forEach((symbol) => {
      // Fire and forget — errors are handled inside loadAudio
      loadAudio(symbol);
    });
  }, [loadAudio]);

  /**
   * Clears the audio cache. Useful if audio files are updated.
   * Not exposed in the UI by default.
   */
  const clearAudioCache = useCallback(() => {
    audioCache.current = {};
  }, []);

  return {
    playPhoneme,
    preloadPhonemes,
    clearAudioCache,
    isLoading: loadingSymbol !== null,
    loadingSymbol,
  };
}
