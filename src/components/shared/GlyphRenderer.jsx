// Renders a single glyph image, or raw IPA text if the glyph has no image.

export default function GlyphRenderer({ glyph, phoneme, size = 48 }) {
  if (glyph && glyph.imageData) {
    return (
      <img
        src={glyph.imageData}
        alt={`Glyph for /${phoneme}/`}
        width={size}
        height={size}
        className="glyph-renderer glyph-renderer--image"
        style={{ width: size, height: size }}
      />
    );
  }

  // Fallback: show raw IPA symbol when no drawing exists yet
  return (
    <span
      className="glyph-renderer glyph-renderer--ipa"
      style={{ fontSize: Math.round(size * 0.5), width: size, height: size }}
      title={phoneme ? `/${phoneme}/ — no glyph drawn yet` : undefined}
    >
      {phoneme || "?"}
    </span>
  );
}
