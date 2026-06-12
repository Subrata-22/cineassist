import { useState, useEffect } from 'react';
import { apiGetMyAnalyses, apiCompareShots } from '../../services/api.js';
import './Compare.css';

export default function Compare() {
  const [analyses, setAnalyses] = useState([]);
  const [shotA, setShotA] = useState(null);
  const [shotB, setShotB] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(true);

  useEffect(() => {
    apiGetMyAnalyses({ limit: 50 })
      .then(d => setAnalyses(d.analyses))
      .finally(() => setFetchingList(false));
  }, []);

  const handleCompare = async () => {
    if (!shotA || !shotB) return;
    setLoading(true); setResult(null);
    try {
      const data = await apiCompareShots(shotA.id, shotB.id);
      setResult(data);
    } catch (e) {
  if (
    e.message.includes('quota') ||
    e.message.includes('429') ||
    e.message.includes('Too Many Requests')
  ) {
    alert('AI comparison quota exceeded. Please try again later.');
  } else if (
    e.message.includes('503') ||
    e.message.includes('high demand') ||
    e.message.includes('Service Unavailable')
  ) {
    alert('AI comparison service is currently busy. Please try again in a minute.');
  } else {
    alert('Failed to compare shots.');
  }
}finally {
      setLoading(false);
    }
  };

  const ShotPicker = ({ label, selected, onSelect }) => (
    <div className="shot-picker">
      <p className="shot-picker-label">{label}</p>
      {selected ? (
        <div className="shot-picked">
          <img src={selected.image_url} alt={selected.title}/>
          <div className="shot-picked-info">
            <span>{selected.title}</span>
            <span className="shot-picked-score">{selected.overall_score}/100</span>
          </div>
          <button className="shot-clear" onClick={() => onSelect(null)}>✕</button>
        </div>
      ) : (
        <div className="shot-pick-list">
          {analyses.map(a => (
            <button key={a.id} className="shot-pick-item" onClick={() => onSelect(a)}>
              <img src={a.image_url} alt={a.title}/>
              <span>{a.title}</span>
              <span className="pick-score">{a.overall_score}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="compare-page">
      <div className="container">
        <div className="compare-header">
          <h1 className="compare-title">A/B Shot Comparison</h1>
          <p className="compare-sub">Select two of your analyses for a side-by-side AI comparison</p>
        </div>

        {fetchingList ? (
          <div className="compare-loading"><div className="spinner"/></div>
        ) : (
          <>
            <div className="compare-pickers">
              <ShotPicker label="Shot A" selected={shotA} onSelect={setShotA}/>
              <div className="vs-divider">VS</div>
              <ShotPicker label="Shot B" selected={shotB} onSelect={setShotB}/>
            </div>

            {shotA && shotB && (
              <div className="compare-action">
                <button className="btn btn-primary" onClick={handleCompare} disabled={loading}>
                  {loading ? 'Comparing…' : 'Compare with AI →'}
                </button>
              </div>
            )}

            {result && (
              <div className="compare-results">
                {/* Side-by-side images */}
                <div className="compare-images">
                  <div className={`compare-shot${result.winner === 'A' ? ' winner' : ''}`}>
                    <img src={result.analysisA.image_url} alt="Shot A"/>
                    <div className="compare-shot-label">
                      Shot A {result.winner === 'A' && <span className="winner-badge">Winner ★</span>}
                    </div>
                    <div className="compare-shot-score">{result.analysisA.overall_score}/100</div>
                  </div>
                  <div className={`compare-shot${result.winner === 'B' ? ' winner' : ''}`}>
                    <img src={result.analysisB.image_url} alt="Shot B"/>
                    <div className="compare-shot-label">
                      Shot B {result.winner === 'B' && <span className="winner-badge">Winner ★</span>}
                    </div>
                    <div className="compare-shot-score">{result.analysisB.overall_score}/100</div>
                  </div>
                </div>

                {/* AI comparison breakdown */}
                <div className="compare-breakdown">
                  {[
                    { label: 'Composition', text: result.comparison.composition_comparison },
                    { label: 'Lighting', text: result.comparison.lighting_comparison },
                    { label: 'Mood', text: result.comparison.mood_comparison },
                    { label: 'Recommendation', text: result.comparison.recommendation },
                  ].map(({ label, text }) => (
                    <div key={label} className="compare-row">
                      <span className="compare-row-label">{label}</span>
                      <p className="compare-row-text">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
