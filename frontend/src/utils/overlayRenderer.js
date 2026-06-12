/**
 * CineAssist — Canvas Overlay Renderer (ES Module)
 */

export function createOverlayRenderer() {
  let overlayCanvas = null;
  let overlayCtx = null;
  let canvasWidth = 0, canvasHeight = 0;
  let activeOverlays = { grid: true, edges: false, balance: false };
  let analysisData = null;

  function init(canvas) {
    overlayCanvas = canvas;
    overlayCtx = canvas.getContext('2d');
  }

  function setSize(w, h) {
    canvasWidth = w; canvasHeight = h;
    if (overlayCanvas) { overlayCanvas.width = w; overlayCanvas.height = h; }
  }

  function setAnalysisData(data) { analysisData = data; }

  function toggle(type) {
    activeOverlays[type] = !activeOverlays[type];
    render();
    return activeOverlays[type];
  }

  function getActiveOverlays() { return { ...activeOverlays }; }

  function clear() {
    if (overlayCtx) overlayCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  }

  function render() {
    clear();
    if (activeOverlays.grid) drawRuleOfThirds();
    if (activeOverlays.edges && analysisData) drawEdges();
    if (activeOverlays.balance && analysisData) drawBalance();
  }

  function drawRuleOfThirds() {
    const ctx = overlayCtx;
    if (!ctx) return;
    const w = canvasWidth, h = canvasHeight;
    ctx.save();
    ctx.strokeStyle = 'rgba(232, 184, 75, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    for (let i = 1; i <= 2; i++) {
      const x = Math.round(w * i / 3);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let i = 1; i <= 2; i++) {
      const y = Math.round(h * i / 3);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(232, 184, 75, 0.8)';
    for (let i = 1; i <= 2; i++) {
      for (let j = 1; j <= 2; j++) {
        const x = Math.round(w * i / 3), y = Math.round(h * j / 3);
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(232, 184, 75, 0.35)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawEdges() {
    if (!analysisData?.edges) return;
    const { edgeMag, width: aw, height: ah } = analysisData.edges;
    const ctx = overlayCtx;
    const scaleX = canvasWidth / aw, scaleY = canvasHeight / ah;
    const edgeImageData = ctx.createImageData(canvasWidth, canvasHeight);
    const out = edgeImageData.data;
    for (let y = 0; y < canvasHeight; y++) {
      for (let x = 0; x < canvasWidth; x++) {
        const sx = Math.floor(x / scaleX), sy = Math.floor(y / scaleY);
        const mag = edgeMag[sy * aw + sx] || 0;
        if (mag > 0.12) {
          const intensity = Math.min(1, mag * 1.5);
          const outIdx = (y * canvasWidth + x) * 4;
          out[outIdx] = Math.round(6 + (251 - 6) * intensity);
          out[outIdx + 1] = Math.round(214 + (191 - 214) * intensity);
          out[outIdx + 2] = Math.round(160 + (36 - 160) * intensity);
          out[outIdx + 3] = Math.round(intensity * 140);
        }
      }
    }
    ctx.putImageData(edgeImageData, 0, 0);
    if (activeOverlays.grid) drawRuleOfThirds();
  }

  function drawBalance() {
    if (!analysisData?.balance) return;
    const { avgQuads } = analysisData.balance;
    const ctx = overlayCtx;
    const hw = canvasWidth / 2, hh = canvasHeight / 2;
    const maxQ = Math.max(...avgQuads), minQ = Math.min(...avgQuads);
    const range = maxQ - minQ || 1;
    const quadPositions = [{ x: 0, y: 0 }, { x: hw, y: 0 }, { x: 0, y: hh }, { x: hw, y: hh }];
    ctx.save();
    quadPositions.forEach((pos, i) => {
      const norm = (avgQuads[i] - minQ) / range;
      const r = Math.round(60 + norm * 191), g = Math.round(120 + norm * 71), b = Math.round(200 - norm * 164);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
      ctx.fillRect(pos.x, pos.y, hw, hh);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '600 14px DM Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(avgQuads[i]), pos.x + hw / 2, pos.y + hh / 2);
    });
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(hw, 0); ctx.lineTo(hw, canvasHeight); ctx.moveTo(0, hh); ctx.lineTo(canvasWidth, hh); ctx.stroke();
    ctx.restore();
    if (activeOverlays.grid) drawRuleOfThirds();
  }

  return { init, setSize, setAnalysisData, toggle, getActiveOverlays, render, clear };
}
