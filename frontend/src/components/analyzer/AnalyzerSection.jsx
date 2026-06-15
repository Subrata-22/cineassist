import { useState, useRef, useCallback } from 'react';
import { analyze } from '../../utils/analyzer.js';
import { apiSaveAnalysis } from '../../services/api.js';
import { useAuth } from '../../store/AuthContext.jsx';
import UploadZone from './UploadZone.jsx';
import CanvasPreview from './CanvasPreview.jsx';
import AnalysisLoader from './AnalysisLoader.jsx';
import ScorePanel from './ScorePanel.jsx';
import FeedbackCards from './FeedbackCards.jsx';
import './AnalyzerSection.css';

export default function AnalyzerSection({ fileInputRef, onAnalysisComplete, onAuthClick }) {
  const { user } = useAuth();
  const [phase, setPhase] = useState('upload');
  const [currentStep, setCurrentStep] = useState(null);
  const [results, setResults] = useState(null);
  const [aiVisionData, setAiVisionData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const canvasRef = useRef(null);
  const pendingImageRef = useRef(null);
  const pendingFileRef = useRef(null);

  const handleImageLoaded = useCallback(async (img, file) => {
    pendingImageRef.current = img;
    pendingFileRef.current = file;
    setPhase('loading');
    setCurrentStep('thirds');
    setSaved(false); setSaveError('');

    try {
  const analysisResults = await analyze(
    img,
    (step) => setCurrentStep(step)
  );

  await new Promise(r => setTimeout(r, 400));

  setResults(analysisResults);
  setPhase('results');

  if (onAnalysisComplete) {
    onAnalysisComplete(analysisResults);
  }
} catch (err) {
  setSaveError(err.message);
  setPhase('upload');
}
  }, [onAnalysisComplete]);

  const handleCanvasReady = useCallback(() => {
    if (!results || !pendingImageRef.current) return;
    canvasRef.current?.drawImage(pendingImageRef.current);
    const overlayData = {};
    results.modules.forEach(m => {
      if (m.name === 'Leading Lines') overlayData.edges = m.data;
      if (m.name === 'Visual Balance') overlayData.balance = m.data;
    });
    setTimeout(() => canvasRef.current?.setAnalysisData(overlayData), 100);
  }, [results]);

  const handleNewImage = useCallback(() => {
    setPhase('upload');
    setResults(null);
    setCurrentStep(null);
    pendingImageRef.current = null;
    pendingFileRef.current = null;
    setSaved(false);
  }, []);

  const handleSave = async () => {
    if (!user) { onAuthClick?.(); return; }
    if (!results || !pendingFileRef.current) return;
    setSaving(true); setSaveError('');
    try {
      const formData = new FormData();
      formData.append('image', pendingFileRef.current);
      formData.append('title', 'Untitled Shot');
      formData.append('overall_score', results.overall);
      formData.append('verdict', results.verdict);
      formData.append('modules', JSON.stringify(results.modules.map(m => ({
        name: m.name, score: m.score, feedback: m.feedback, suggestion: m.suggestion
      }))));
      formData.append('image_width', pendingImageRef.current.naturalWidth);
      formData.append('image_height', pendingImageRef.current.naturalHeight);
      formData.append('is_public', 'true');
      const savedAnalysis = await apiSaveAnalysis(formData);

console.log(savedAnalysis);

setAiVisionData(savedAnalysis.aiVisionData);
setSaved(true);

window.dispatchEvent(
  new CustomEvent('analysis-created')
);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="section analyzer-section" id="analyzer">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Analyzer</span>
          <h2 className="section-title">Composition<br/>Intelligence</h2>
          <p className="section-desc">Upload any frame for instant AI-powered composition feedback.</p>
        </div>

        <div className="analyzer-workspace">
          {phase === 'upload' && (
  <>
    {saveError && (
      <div
        style={{
          color: '#ff6b6b',
          marginBottom: '16px',
          textAlign: 'center',
          fontWeight: '600'
        }}
      >
        ❌ {saveError}
      </div>
    )}

    <UploadZone
      onImageLoaded={handleImageLoaded}
      fileInputRef={fileInputRef}
    />
  </>
)}
          {phase === 'loading' && (
            <div className="loading-container">
              <AnalysisLoader currentStep={currentStep}/>
            </div>
          )}
          {phase === 'results' && results && (
            <div className="results-layout">
              <div className="results-top-row">
                <div className="results-canvas-col">
                  <CanvasPreview ref={canvasRef} onNewImage={handleNewImage} onReady={handleCanvasReady}/>
                </div>
                <div className="results-score-col">
                  <ScorePanel results={results}/>
                  <div className="results-save-row">
                    {saved ? (
                      <p className="save-success">✓ Saved to your portfolio!</p>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving…' : user ? '⬆ Save to Portfolio' : '⬆ Sign in to Save'}
                      </button>
                    )}
                    {saveError && <p className="save-error">{saveError}</p>}
                  </div>
                </div>
              </div>
              {aiVisionData && (
  <div
    style={{
      marginTop: '24px',
      padding: '20px',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px'
    }}
  >
    <h3>🤖 Gemini AI Analysis</h3>

    <p>
      <strong>Subject:</strong> {aiVisionData.subject}
    </p>

    <p>
      <strong>Analysis:</strong>
      <br />
      {aiVisionData.compositionCommentary}
    </p>

    <ul>
      {aiVisionData.suggestions?.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ul>
  </div>
)}
              <FeedbackCards modules={results.modules}/>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
