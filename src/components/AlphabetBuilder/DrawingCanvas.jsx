// Canvas component with draw/clear/undo controls; emits imageData on save.

import { useRef, useState, useEffect } from "react";

// Internal canvas resolution — separate from display size so glyphs are crisp
const CANVAS_SIZE = 300;

export default function DrawingCanvas({ initialImage, onSave, onClear }) {
  const canvasRef = useRef(null);
  const indicatorCanvasRef = useRef(null); // overlay for snap dot — never exported
  const isDrawingRef = useRef(false);
  // Each entry is an ImageData snapshot taken before a stroke begins (for undo)
  const strokeHistoryRef = useRef([]);
  // Line tool state: null = no line started, "preview" = awaiting second click
  const linePhaseRef = useRef(null);
  const lineStartRef = useRef(null);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [activeTool, setActiveTool] = useState("freehand"); // "freehand" | "line"
  const [snapToGrid, setSnapToGrid] = useState(false);

  // When a different glyph is loaded for redrawing, render it onto the canvas.
  // The `key` prop on DrawingCanvas in the container causes a remount when selection
  // changes, so this effect also fires on "new glyph" (initialImage === null).
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    strokeHistoryRef.current = [];
    linePhaseRef.current = null;
    lineStartRef.current = null;

    // Clear the indicator overlay (inlined to avoid the hooks plugin flagging
    // the access of a function declared later in the component body).
    const indicator = indicatorCanvasRef.current;
    if (indicator) {
      indicator.getContext("2d").clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

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

  /** Cancels an in-progress line, restoring the canvas to before the anchor was set. */
  function cancelLine() {
    const snapshot = strokeHistoryRef.current[strokeHistoryRef.current.length - 1];
    const ctx = canvasRef.current.getContext("2d");
    ctx.putImageData(snapshot, 0, 0);
    strokeHistoryRef.current.pop(); // remove the snapshot pushed when the line started
    linePhaseRef.current = null;
    lineStartRef.current = null;
    clearSnapIndicator();
  }

  /** Draws a small dot on the indicator overlay at the snapped position. */
  function drawSnapIndicator(x, y) {
    const canvas = indicatorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.beginPath();
    ctx.arc(snap(x), snap(y), 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(120, 230, 140, 0.8)";
    ctx.fill();
  }

  /** Clears the indicator overlay. */
  function clearSnapIndicator() {
    const canvas = indicatorCanvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
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

  /** Snaps a canvas coordinate to the nearest 10px grid point when snap is enabled. */
  function snap(coord) {
    return snapToGrid ? Math.round(coord / 10) * 10 : coord;
  }

  /** Returns a configured canvas context ready for drawing strokes. */
  function getStyledContext() {
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#c9a84c";
    return ctx;
  }

  function handlePointerDown(e) {
    // Ignore right-click here — handled by onContextMenu
    if (e.button === 2) return;
    e.preventDefault();

    const { x, y } = getCanvasPoint(e);

    if (activeTool === "line") {
      if (linePhaseRef.current === null) {
        // First click: anchor the start, begin preview phase
        pushSnapshot();
        lineStartRef.current = { x: snap(x), y: snap(y) };
        linePhaseRef.current = "preview";
        clearSnapIndicator();
      } else {
        // Second click: preview line is already on canvas from last mousemove; commit it
        linePhaseRef.current = null;
        lineStartRef.current = null;
        canvasRef.current.getContext("2d").beginPath();
        clearSnapIndicator();
      }
      return;
    }

    // Freehand
    pushSnapshot();
    isDrawingRef.current = true;
    const ctx = getStyledContext();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(e) {
    e.preventDefault();
    const { x, y } = getCanvasPoint(e);

    if (activeTool === "line") {
      // Show snap indicator whenever snap is on and line tool is active
      if (snapToGrid) {
        drawSnapIndicator(x, y);
      }

      if (linePhaseRef.current === "preview") {
        // Restore canvas to pre-line state, then draw a fresh preview line each frame.
        // Peek at snapshot (do not pop — undo still needs it).
        const ctx = getStyledContext();
        const snapshot = strokeHistoryRef.current[strokeHistoryRef.current.length - 1];
        ctx.putImageData(snapshot, 0, 0);
        const { x: sx, y: sy } = lineStartRef.current;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(snap(x), snap(y));
        ctx.stroke();
      }
      return;
    }

    if (!isDrawingRef.current) return;
    const ctx = getStyledContext();
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function handlePointerUp() {
    // Line tool uses click events (pointerDown), not drag — nothing to do here
    if (activeTool === "line") return;
    isDrawingRef.current = false;
    canvasRef.current.getContext("2d").beginPath();
  }

  function handleMouseLeave() {
    clearSnapIndicator();
    handlePointerUp();
  }

  /** Right-click cancels an in-progress line. */
  function handleContextMenu(e) {
    e.preventDefault();
    if (activeTool === "line" && linePhaseRef.current === "preview") {
      cancelLine();
    }
  }

  /** Restores the canvas to the state before the last stroke. */
  function handleUndo() {
    // Cancel an in-progress line first without consuming a history entry
    if (activeTool === "line" && linePhaseRef.current === "preview") {
      cancelLine();
      return;
    }
    if (strokeHistoryRef.current.length === 0) return;
    const ctx = canvasRef.current.getContext("2d");
    const snapshot = strokeHistoryRef.current.pop();
    ctx.putImageData(snapshot, 0, 0);
  }

  /** Clears the canvas and tells the container to deselect any loaded glyph. */
  function handleClear() {
    if (activeTool === "line" && linePhaseRef.current === "preview") {
      cancelLine();
    }
    pushSnapshot();
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    onClear();
  }

  /** Switches tool, cancelling any in-progress line and clearing the snap indicator. */
  function handleToolChange(tool) {
    if (tool !== "line" && linePhaseRef.current === "preview") {
      cancelLine();
    }
    clearSnapIndicator();
    setActiveTool(tool);
  }

  /** Toggles snap, clearing the indicator if turning off. */
  function handleSnapChange(enabled) {
    if (!enabled) clearSnapIndicator();
    setSnapToGrid(enabled);
  }

  /** Exports the canvas as a base64 PNG and fires onSave. */
  function handleSave() {
    const imageData = canvasRef.current.toDataURL("image/png");
    onSave(imageData);
  }

  return (
    <div className="drawing-canvas">
      <div className="drawing-canvas__tools">
        <button
          className={`toggle-btn ${activeTool === "freehand" ? "toggle-btn--active" : ""}`}
          onClick={() => handleToolChange("freehand")}
          title="Freehand draw"
        >
          Freehand
        </button>
        <button
          className={`toggle-btn ${activeTool === "line" ? "toggle-btn--active" : ""}`}
          onClick={() => handleToolChange("line")}
          title="Click to start line, click again to commit, right-click to cancel"
        >
          Line
        </button>
        {activeTool === "line" && (
          <label className="drawing-canvas__snap-label">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => handleSnapChange(e.target.checked)}
            />
            Snap to grid
          </label>
        )}
      </div>

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

      <div className="drawing-canvas__surface">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="drawing-canvas__canvas"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handleMouseLeave}
          onContextMenu={handleContextMenu}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
        <canvas
          ref={indicatorCanvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="drawing-canvas__indicator"
        />
      </div>

      <button className="button button--primary drawing-canvas__save-btn" onClick={handleSave}>
        Save glyph
      </button>
    </div>
  );
}
