// Modal for choosing export format and previewing the full file before downloading.
// Opened from App.jsx — manages no alphabet state itself, receives the alphabets
// to export (and a title to display) as props.

import { useState, useEffect, useMemo, useRef } from "react";
import {
  buildExportPayload,
  triggerJSONDownload,
  sanitizeFilename,
  CONLANG_FILE_EXTENSION,
} from "../../utils/persistence";
import "./ExportModal.css";

// Grid dimensions used when compositing glyphs into a PNG image sheet.
const IMG_CELL_SIZE = 72;
const IMG_LABEL_HEIGHT = 22;
const IMG_PADDING = 16;
const IMG_COLS = 8;

export default function ExportModal({ isOpen, onClose, alphabets, title }) {
  const [activeTab, setActiveTab] = useState("download");
  const [format, setFormat] = useState("conlang");
  const backdropRef = useRef(null);

  // Reset to download tab each time the modal opens. The component stays
  // mounted while closed (so useState doesn't re-initialize), so an effect is
  // the correct way to react to the open transition.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) setActiveTab("download");
  }, [isOpen]);

  // Close on Escape key.
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Memoize the highlighted JSON lines so we don't rebuild on every render
  // while the preview tab is open. Recomputes only when inputs change.
  const highlightedLines = useMemo(() => {
    if (!isOpen || activeTab !== "preview") return null;
    const payload = buildDisplayPayload(buildExportPayload(alphabets));
    return JSON.stringify(payload, null, 2).split("\n").map(highlightJSONLine);
  }, [isOpen, activeTab, alphabets]);

  if (!isOpen) return null;

  const glyphCount = alphabets.reduce((n, a) => n + a.glyphs.length, 0);

  // ---------------------------------------------------------------------------
  // DOWNLOAD HANDLERS
  // ---------------------------------------------------------------------------

  /** Builds a filename stem from the alphabets being exported. */
  function filenameStem() {
    return alphabets.length === 1
      ? sanitizeFilename(alphabets[0]?.name)
      : "all_alphabets";
  }

  /** Downloads the payload as a .conlang or .json file. */
  function handleDownload() {
    const payload = buildExportPayload(alphabets);
    const ext = format === "json" ? ".json" : CONLANG_FILE_EXTENSION;
    triggerJSONDownload(payload, filenameStem() + ext);
  }

  /** Composites all glyph images onto a canvas and downloads as a PNG sheet. */
  async function handleDownloadAsImage() {
    const glyphs = alphabets.flatMap((a) => a.glyphs.filter((g) => g.imageData));
    if (glyphs.length === 0) return;

    const cols = Math.min(glyphs.length, IMG_COLS);
    const rows = Math.ceil(glyphs.length / cols);
    const canvas = document.createElement("canvas");
    canvas.width = cols * IMG_CELL_SIZE + IMG_PADDING * 2;
    canvas.height = rows * (IMG_CELL_SIZE + IMG_LABEL_HEIGHT) + IMG_PADDING * 2;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0a0d14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < glyphs.length; i++) {
      const glyph = glyphs[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = IMG_PADDING + col * IMG_CELL_SIZE;
      const y = IMG_PADDING + row * (IMG_CELL_SIZE + IMG_LABEL_HEIGHT);

      // Draw the glyph image onto the canvas cell.
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, x, y, IMG_CELL_SIZE, IMG_CELL_SIZE);
          resolve();
        };
        img.onerror = resolve;
        img.src = glyph.imageData;
      });

      // Draw the IPA label centred in the label band under the cell.
      ctx.fillStyle = "#c9a84c";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        glyph.label || glyph.phonemes?.[0] || "?",
        x + IMG_CELL_SIZE / 2,
        y + IMG_CELL_SIZE + IMG_LABEL_HEIGHT / 2
      );
    }

    const link = document.createElement("a");
    link.download = filenameStem() + "_glyphs.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div
      className="export-modal__backdrop"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="export-modal" role="dialog" aria-modal="true" aria-label={title}>

        <div className="export-modal__header">
          <h2 className="export-modal__title">{title}</h2>
          <button className="export-modal__close" onClick={onClose} aria-label="Close export modal">✕</button>
        </div>

        <div className="export-modal__tabs" role="tablist">
          {["download", "preview"].map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={`export-modal__tab ${activeTab === tab ? "export-modal__tab--active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "download" ? "Download" : "Preview file"}
            </button>
          ))}
        </div>

        <div className="export-modal__body">

          {activeTab === "download" && (
            <div className="export-modal__download-panel">
              <p className="export-modal__meta">
                {alphabets.length} alphabet{alphabets.length !== 1 ? "s" : ""} &middot;{" "}
                {glyphCount} glyph{glyphCount !== 1 ? "s" : ""}
              </p>

              <div className="export-modal__section">
                <span className="export-modal__label">File format</span>
                <div className="export-modal__format-toggle">
                  {[
                    { id: "conlang", ext: ".conlang", note: "native · importable" },
                    { id: "json",    ext: ".json",    note: "portable · opens anywhere" },
                  ].map(({ id, ext, note }) => (
                    <button
                      key={id}
                      className={`export-modal__format-btn ${format === id ? "export-modal__format-btn--active" : ""}`}
                      onClick={() => setFormat(id)}
                    >
                      {ext}
                      <span className="export-modal__format-note">{note}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="export-modal__actions">
                <button className="button button--primary export-modal__action-btn" onClick={handleDownload}>
                  Download {format === "json" ? ".json" : ".conlang"}
                </button>
                <button
                  className="button button--ghost export-modal__action-btn"
                  onClick={handleDownloadAsImage}
                  disabled={glyphCount === 0}
                  title={glyphCount === 0 ? "No glyphs to export" : "Download all glyphs as a PNG image sheet"}
                >
                  Download as image
                </button>
              </div>

              {glyphCount === 0 && (
                <p className="export-modal__warning">No glyphs drawn yet — the image sheet will be empty.</p>
              )}
            </div>
          )}

          {activeTab === "preview" && (
            <div className="export-modal__preview-panel">
              <p className="export-modal__preview-note">
                Image data is summarised — the actual file contains full base64 PNG strings.
              </p>
              <pre className="export-preview" aria-label="File preview">
                <code>
                  {highlightedLines?.map((html, i) => (
                    <div key={i} dangerouslySetInnerHTML={{ __html: html }} />
                  ))}
                </code>
              </pre>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Returns a display-safe copy of the payload where every imageData string is
 * replaced with a short summary so the preview stays readable.
 */
function buildDisplayPayload(payload) {
  function process(value) {
    if (Array.isArray(value)) return value.map(process);
    if (value && typeof value === "object") {
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        if (k === "imageData" && typeof v === "string") {
          const kb = ((v.length * 0.75) / 1024).toFixed(1);
          out[k] = `[PNG ~${kb} KB — not shown]`;
        } else {
          out[k] = process(v);
        }
      }
      return out;
    }
    return value;
  }
  return process(payload);
}

/**
 * Escapes HTML-significant characters so user-supplied strings (e.g. imported
 * alphabet names) can't inject markup when rendered via innerHTML.
 * JSON strings always escape `"` as `\"`, so we leave literal `"` alone so the
 * highlighting regex can still match quoted tokens.
 */
function escapeHTML(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Returns an HTML string (safe to feed to dangerouslySetInnerHTML) with
 * simple JSON syntax highlighting applied to a single line.
 */
function highlightJSONLine(line) {
  const escaped = escapeHTML(line);
  return escaped
    .replace(/("(?:[^"\\]|\\.)*")(\s*:)/g, '<span class="export-preview__key">$1</span>$2')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="export-preview__string">$1</span>')
    .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="export-preview__number">$1</span>')
    .replace(/:\s*(true|false|null)\b/g, ': <span class="export-preview__keyword">$1</span>');
}
