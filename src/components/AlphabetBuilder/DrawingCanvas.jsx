// Canvas component with draw/clear/undo controls; emits imageData on save.

import { useRef, useState, useEffect } from "react";

// Internal canvas resolution — separate from display size so glyphs are crisp
const CANVAS_SIZE = 300;

export default function DrawingCanvas({ initialImage, onSave, onClear }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  // Each entry is an ImageData snapshot taken before a stroke begins (for undo)
  const strokeHistoryRef = useRef([]);
  const [strokeWidth, setStrokeWidth] = useState(4);

  // When a different glyph is loaded for redrawing, render it onto the canvas.
  // The `key` prop on DrawingCanvas in the container causes a remount when selection
  // changes, so this effect also fires on "new glyph" (initialImage === null).
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    strokeHistoryRef.current = [];

    if (initialImage) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      img.src = initialImage;
    }
  }, [initialImage]);

  /** Saves the current canvas state to the undo history before a new stroke. */
  function pushSnapshot() {
    const ctx = canvasRef.current.getContext("2d");
    const snapshot = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    strokeHistoryRef.current.push(snapshot);
    // Cap at 10 to avoid excessive memory use with large base64 image data
    if (strokeHistoryRef.current.length > 10) {
      strokeHistoryRef.current.shift();
    }
  }

  /** Converts a mouse or touch event into canvas coordinates. */
  function getCanvasPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function handlePointerDown(e) {
    e.preventDefault();
    pushSnapshot();
    isDrawingRef.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(e) {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#c9a84c";
    const { x, y } = getCanvasPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function handlePointerUp() {
    isDrawingRef.current = false;
    // Reset path so the next stroke doesn't connect to this one
    canvasRef.current.getContext("2d").beginPath();
  }

  /** Restores the canvas to the state before the last stroke. */
  function handleUndo() {
    if (strokeHistoryRef.current.length === 0) return;
    const ctx = canvasRef.current.getContext("2d");
    const snapshot = strokeHistoryRef.current.pop();
    ctx.putImageData(snapshot, 0, 0);
  }

  /** Clears the canvas and tells the container to deselect any loaded glyph. */
  function handleClear() {
    pushSnapshot();
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    onClear();
  }

  /** Exports the canvas as a base64 PNG and fires onSave. */
  function handleSave() {
    const imageData = canvasRef.current.toDataURL("image/png");
    onSave(imageData);
  }

  return (
    <div className="drawing-canvas">
      <div className="drawing-canvas__toolbar">
        <label className="drawing-canvas__stroke-control">
          <span>Stroke</span>
          <input
            type="range"
            min={1}
            max={16}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="drawing-canvas__stroke-slider"
            aria-label="Stroke width"
          />
          <span className="drawing-canvas__stroke-value">{strokeWidth}px</span>
        </label>

        <button className="button button--ghost" onClick={handleUndo} title="Undo last stroke">
          Undo
        </button>
        <button className="button button--ghost" onClick={handleClear} title="Clear canvas">
          Clear
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="drawing-canvas__canvas"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />

      <button className="button button--primary drawing-canvas__save-btn" onClick={handleSave}>
        Save glyph
      </button>
    </div>
  );
}
