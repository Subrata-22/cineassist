import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { createOverlayRenderer } from '../../utils/overlayRenderer';
import './CanvasPreview.css';

const CanvasPreview = forwardRef(function CanvasPreview({ onNewImage, onReady }, ref) {
  const previewRef = useRef(null);
  const overlayRef = useRef(null);
  const wrapperRef = useRef(null);
  const rendererRef = useRef(null);
  const [activeOverlays, setActiveOverlays] = useState({ grid: true, edges: false, balance: false });

  useEffect(() => {
    rendererRef.current = createOverlayRenderer();
    if (overlayRef.current) rendererRef.current.init(overlayRef.current);
    if (onReady) onReady();
  }, []);

  useImperativeHandle(ref, () => ({
    drawImage(img) {
      const renderer = rendererRef.current;
      if (!renderer || !overlayRef.current) return;
      renderer.init(overlayRef.current);

      const maxW = wrapperRef.current?.clientWidth || 800;
      const maxH = 500;
      let w = img.naturalWidth, h = img.naturalHeight;
      const scale = Math.min(1, maxW / w, maxH / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);

      const canvas = previewRef.current;
      canvas.width = w; canvas.height = h;
      if (wrapperRef.current) wrapperRef.current.style.height = h + 'px';
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      renderer.setSize(w, h);
      renderer.render();
    },
    setAnalysisData(data) {
      rendererRef.current?.setAnalysisData(data);
      rendererRef.current?.render();
    }
  }));

  const toggleOverlay = (type) => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.toggle(type);
    setActiveOverlays({ ...renderer.getActiveOverlays() });
  };

  return (
    <div className="canvas-preview-section">
      <div className="canvas-wrapper" ref={wrapperRef}>
        <canvas ref={previewRef} className="preview-canvas" />
        <canvas ref={overlayRef} className="overlay-canvas" />
      </div>
      <div className="canvas-controls">
        <div className="overlay-toggles">
          {[
            { key: 'grid', label: 'Rule of Thirds', icon: '⊞' },
            { key: 'edges', label: 'Leading Lines', icon: '↗' },
            { key: 'balance', label: 'Balance Map', icon: '⚖' },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              className={`overlay-toggle${activeOverlays[key] ? ' active' : ''}`}
              onClick={() => toggleOverlay(key)}
            >
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary btn-sm new-image-btn" onClick={onNewImage}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-3.55" />
          </svg>
          New Image
        </button>
      </div>
    </div>
  );
});

export default CanvasPreview;
