import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiGetAnalysis, apiGetComments, apiAddComment, apiDeleteComment, apiToggleLike, apiGenerateAIReview } from '../../services/api.js';
import { useAuth } from '../../store/AuthContext.jsx';
import { exportAnalysisPDF } from '../../utils/exportPDF.js';
import './AnalysisDetail.css';

const MODULE_ICONS = { 'Rule of Thirds':'⊞','Visual Balance':'⚖','Symmetry':'⟷','Color Harmony':'🎨','Brightness & Contrast':'☀','Leading Lines':'↗' };
const getScoreColor = s => s >= 75 ? 'var(--accent-cyan)' : s >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)';

function ScoreBar({ score, color }) {
  return (
    <div className="score-bar-bg">
      <div className="score-bar-fill" style={{ width: `${score}%`, background: color }}/>
    </div>
  );
}

export default function AnalysisDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('feedback');
  const [exporting, setExporting] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    Promise.all([
      apiGetAnalysis(id),
      apiGetComments(id),
    ]).then(([a, c]) => {
      setAnalysis(a);
      setComments(c);
      setLiked(a.is_liked);
    }).catch(() => navigate('/explore'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!user) return;
    const result = await apiToggleLike(id);
    setLiked(result.liked);
    setAnalysis(a => ({ ...a, like_count: parseInt(a.like_count) + (result.liked ? 1 : -1) }));
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const c = await apiAddComment(id, { content: newComment.trim() });
    setComments(prev => [...prev, c]);
    setNewComment('');
  };

  const handleDeleteComment = async (cid) => {
    await apiDeleteComment(cid);
    setComments(c => c.filter(x => x.id !== cid));
  };

  const handleExport = async () => {
    setExporting(true);
    await exportAnalysisPDF(analysis);
    setExporting(false);
  };

  const handleGenerateAIReview = async () => {
  try {
    setGeneratingAI(true);

    const aiData = await apiGenerateAIReview(id);

    setAnalysis(prev => ({
      ...prev,
      ai_feedback: aiData.overall_assessment,
      genre: aiData.genre,
      mood: aiData.mood,
      ai_suggestions: aiData.suggestions
    }));
} catch (err) {
  alert(err.message);
  }
   finally {
    setGeneratingAI(false);
  }
};

  if (loading) return <div className="detail-loading"><div className="spinner"/></div>;
  if (!analysis) return null;

  const modules = Array.isArray(analysis.modules) ? analysis.modules : JSON.parse(analysis.modules || '[]');

  return (
    <div className="analysis-detail">
      <div className="container">
        {/* Breadcrumb */}
        <div className="detail-breadcrumb">
          <Link to="/explore">Explore</Link>
          <span>/</span>
          <Link to={`/user/${analysis.username}`}>@{analysis.username}</Link>
          <span>/</span>
          <span>{analysis.title}</span>
        </div>

        <div className="detail-layout">
          {/* Left: image + scores */}
          <div className="detail-left">
            <div className="detail-image-wrap">
              <img src={analysis.image_url} alt={analysis.title} className="detail-image"/>
              <div className="detail-image-badge">{analysis.overall_score}/100</div>
            </div>

            {/* Recomposition crop hint */}
            {analysis.recomposition_crop && (
              <div className="recomp-card">
                <div className="recomp-header">
                  <span>✂</span>
                  <span>Suggested Reframe</span>
                </div>
                <p className="recomp-reason">{analysis.recomposition_crop.reason}</p>
              </div>
            )}

            {/* Module score bars */}
            <div className="detail-module-bars">
              {modules.map(m => (
                <div key={m.name} className="detail-module-row">
                  <span className="detail-module-icon">{MODULE_ICONS[m.name] || '●'}</span>
                  <span className="detail-module-name">{m.name}</span>
                  <ScoreBar score={m.score} color={getScoreColor(m.score)}/>
                  <span className="detail-module-score" style={{ color: getScoreColor(m.score) }}>{m.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: info + tabs */}
          <div className="detail-right">
            <div className="detail-top">
              <div>
                <div className="detail-meta">
                  {analysis.genre && <span className="detail-tag">{analysis.genre}</span>}
                  {analysis.mood && <span className="detail-tag detail-tag--mood">{analysis.mood}</span>}
                </div>
                <h1 className="detail-title">{analysis.title}</h1>
                <p className="detail-verdict">{analysis.verdict}</p>
                <div className="detail-user-row">
                  <div className="user-avatar">{analysis.username[0].toUpperCase()}</div>
                  <Link to={`/user/${analysis.username}`} className="detail-username">@{analysis.username}</Link>
                  <span className="detail-date">{new Date(analysis.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="detail-actions">
                <button className={`detail-action-btn${liked ? ' liked' : ''}`} onClick={handleLike} disabled={!user}>
                  ♥ {analysis.like_count}
                </button>
                <button className="detail-action-btn" onClick={handleExport} disabled={exporting}>
                  {exporting ? '…' : '⬇ PDF'}
                </button>
                {user?.id === analysis.user_id && (
                  <Link to="/analyze" className="detail-action-btn">+ Compare</Link>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="detail-tabs">
              {['feedback','comments'].map(t => (
                <button key={t} className={`detail-tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
                  {t === 'feedback' ? 'AI Feedback' : `Comments (${comments.length})`}
                </button>
              ))}
            </div>

            {activeTab === 'feedback' && (
              <div className="detail-feedback">
                <div className="ai-feedback-block">
  <div className="ai-feedback-label">
    <span className="ai-dot" />
    AI Composition Review
  </div>

  {!analysis.ai_feedback && (
    <button
      className="detail-action-btn"
      onClick={handleGenerateAIReview}
      disabled={generatingAI}
      style={{ marginBottom: '16px' }}
    >
      {generatingAI ? 'Generating...' : '🤖 Generate AI Review'}
    </button>
  )}

  <p className="ai-feedback-text">
    {analysis.ai_feedback ||
      'No AI review has been generated for this shot yet.'}
  </p>
</div>

                {analysis.ai_suggestions?.length > 0 && (
                  <div className="ai-suggestions">
                    <h4 className="ai-suggestions-title">Suggestions</h4>
                    {analysis.ai_suggestions.map((s, i) => (
                      <div key={i} className="ai-suggestion-item">
                        <span className="ai-suggestion-num">{i + 1}</span>
                        <p>{s}</p>
                      </div>
                    ))}
                  </div>
                )}

                {modules.map(m => (
                  <div key={m.name} className="detail-feedback-card">
                    <div className="detail-feedback-header">
                      <span className="detail-fb-icon">{MODULE_ICONS[m.name]}</span>
                      <span className="detail-fb-name">{m.name}</span>
                      <span className="detail-fb-score" style={{ color: getScoreColor(m.score) }}>{m.score}/100</span>
                    </div>
                    <p className="detail-fb-text">{m.feedback}</p>
                    <p className="detail-fb-suggestion">→ {m.suggestion}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="detail-comments">
                {user && (
                  <form onSubmit={handleComment} className="comment-form">
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Share your thoughts on this composition…"
                      className="comment-input"
                      rows={3}
                    />
                    <button type="submit" className="btn btn-primary btn-sm">Post</button>
                  </form>
                )}
                {comments.length === 0 ? (
                  <p className="no-comments">No comments yet. Be the first!</p>
                ) : (
                  <div className="comments-list">
                    {comments.map(c => (
                      <div key={c.id} className="comment-item">
                        <div className="user-avatar comment-avatar">{c.username[0].toUpperCase()}</div>
                        <div className="comment-body">
                          <div className="comment-meta">
                            <Link to={`/user/${c.username}`} className="comment-username">@{c.username}</Link>
                            <span className="comment-date">{new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="comment-text">{c.content}</p>
                        </div>
                        {(user?.id === c.user_id || user?.role === 'admin') && (
                          <button className="comment-delete" onClick={() => handleDeleteComment(c.id)}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
