import { useState, useEffect } from 'react';
import { apiGetMySequences, apiGetMyAnalyses, apiCreateSequence, apiUpdateSequence, apiDeleteSequence, apiGetSequence } from '../../services/api.js';
import './Storyboard.css';

export default function Storyboard() {
  const [sequences, setSequences] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [activeSeq, setActiveSeq] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiGetMySequences(), apiGetMyAnalyses({ limit: 100 })])
      .then(([seqs, data]) => { setSequences(seqs); setAnalyses(data.analyses); })
      .finally(() => setLoading(false));
  }, []);

  const createSeq = async () => {
    if (!newTitle.trim()) return;
    const seq = await apiCreateSequence({ title: newTitle.trim(), analysis_ids: [] });
    setSequences(s => [seq, ...s]);
    setActiveSeq({ ...seq, analyses: [] });
    setCreating(false);
    setNewTitle('');
  };

  const addToSequence = async (analysis) => {
    if (!activeSeq) return;
    const alreadyIn = activeSeq.analysis_ids?.includes(analysis.id);
    if (alreadyIn) return;
    const newIds = [...(activeSeq.analysis_ids || []), analysis.id];
    const updated = await apiUpdateSequence(activeSeq.id, { analysis_ids: newIds });
    setActiveSeq({ ...updated, analyses: [...(activeSeq.analyses || []), analysis] });
    setSequences(s => s.map(x => x.id === updated.id ? updated : x));
  };

  const removeFromSequence = async (analysisId) => {
    if (!activeSeq) return;
    const newIds = (activeSeq.analysis_ids || []).filter(id => id !== analysisId);
    const updated = await apiUpdateSequence(activeSeq.id, { analysis_ids: newIds });
    setActiveSeq({ ...updated, analyses: (activeSeq.analyses || []).filter(a => a.id !== analysisId) });
    setSequences(s => s.map(x => x.id === updated.id ? updated : x));
  };

  const deleteSeq = async (id) => {
    if (!confirm('Delete this sequence?')) return;
    await apiDeleteSequence(id);
    setSequences(s => s.filter(x => x.id !== id));
    if (activeSeq?.id === id) setActiveSeq(null);
  };

  if (loading) return <div className="sb-loading"><div className="spinner"/></div>;

  return (
    <div className="storyboard-page">
      <div className="container">
        <div className="sb-header">
          <h1 className="sb-title">Storyboard Builder</h1>
          <p className="sb-sub">Arrange your shots into sequences to build a visual narrative</p>
        </div>

        <div className="sb-layout">
          {/* Sequence list sidebar */}
          <div className="sb-sidebar">
            <div className="sb-sidebar-top">
              <span className="sb-sidebar-label">Sequences</span>
              <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>+ New</button>
            </div>

            {creating && (
              <div className="sb-create-form">
                <input
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createSeq()}
                  placeholder="Sequence title…"
                  className="sb-create-input"
                />
                <div className="sb-create-btns">
                  <button className="btn btn-primary btn-sm" onClick={createSeq}>Create</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setCreating(false)}>Cancel</button>
                </div>
              </div>
            )}

            {sequences.length === 0 ? (
              <p className="sb-empty-sidebar">No sequences yet.</p>
            ) : (
              sequences.map(seq => (
                <div
                  key={seq.id}
                  className={`sb-seq-item${activeSeq?.id === seq.id ? ' active' : ''}`}
                  onClick={async () => {
                    const full = await apiGetSequence(seq.id);
                    setActiveSeq(full);
                  }}
                >
                  <div className="sb-seq-name">{seq.title}</div>
                  <div className="sb-seq-meta">{(seq.analysis_ids || []).length} shots</div>
                  <div className="sb-seq-btns" onClick={e => e.stopPropagation()}>
                    <button className="sb-icon-btn sb-icon-delete" onClick={() => deleteSeq(seq.id)}>✕</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Main canvas */}
          <div className="sb-main">
            {!activeSeq ? (
              <div className="sb-main-empty">
                <p>Select or create a sequence to begin</p>
              </div>
            ) : (
              <>
                <div className="sb-main-top">
                  <h2 className="sb-main-title">{activeSeq.title}</h2>
                  <span className="sb-main-count">{(activeSeq.analysis_ids || []).length} shots</span>
                </div>

                {/* Timeline strip */}
                <div className="sb-timeline">
                  {(activeSeq.analyses || []).length === 0 && (
                    <div className="sb-timeline-empty">Add shots from the panel below →</div>
                  )}
                  {(activeSeq.analyses || []).map((a, i) => (
                    <div key={a.id} className="sb-frame">
                      <div className="sb-frame-num">{i + 1}</div>
                      <img src={a.image_url} alt={a.title} className="sb-frame-img"/>
                      <div className="sb-frame-score">{a.overall_score}</div>
                      <button className="sb-frame-remove" onClick={() => removeFromSequence(a.id)}>✕</button>
                      <div className="sb-frame-title">{a.title}</div>
                    </div>
                  ))}
                </div>

                {/* Shot pool */}
                <div className="sb-pool-header">Add Shots</div>
                <div className="sb-pool">
                  {analyses
                    .filter(a => !(activeSeq.analysis_ids || []).includes(a.id))
                    .map(a => (
                      <button key={a.id} className="sb-pool-item" onClick={() => addToSequence(a)}>
                        <img src={a.image_url} alt={a.title}/>
                        <div className="sb-pool-overlay">
                          <span className="sb-pool-score">{a.overall_score}</span>
                          <span className="sb-pool-add">+</span>
                        </div>
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
