import { useState } from 'react';
import './UploadZone.css';

export default function UploadZone({ onImageLoaded, fileInputRef }) {
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => onImageLoaded(img, file);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      className={`upload-zone${dragging ? ' drag-over' : ''}`}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="file-input-hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <div className="upload-viewfinder">
        <span className="vf-corner vf-tl"/><span className="vf-corner vf-tr"/>
        <span className="vf-corner vf-bl"/><span className="vf-corner vf-br"/>
      </div>
      <div className="upload-icon-wrap">
        <svg className="upload-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>
      <h3 className="upload-title">Drop your shot here</h3>
      <p className="upload-sub">
        Drag & drop or{' '}
        <button className="upload-browse" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
          browse files
        </button>
      </p>
      <p className="upload-hint">JPG · PNG · WEBP — any aspect ratio</p>
    </div>
  );
}
