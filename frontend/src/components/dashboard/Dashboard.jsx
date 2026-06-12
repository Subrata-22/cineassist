import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../../store/AuthContext.jsx';
import {
  apiGetMyAnalyses,
  apiGetScoreHistory,
  apiDeleteAnalysis,
  apiRenameAnalysis,
  apiToggleVisibility,
   apiDeleteAccount
} from '../../services/api.js';
import './Dashboard.css';

const ScoreRing = ({ score }) => {
  const circ = 163;
  const offset = circ - (circ * score) / 100;
  return (
    <svg viewBox="0 0 60 60" width="60" height="60">
      <circle cx="30" cy="30" r="26" stroke="var(--bg-elevated)" strokeWidth="4" fill="none"/>
      <circle cx="30" cy="30" r="26" stroke="var(--accent-primary)" strokeWidth="4" fill="none"
        strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}/>
      <text x="30" y="35" textAnchor="middle" fill="var(--text-bright)" fontSize="12" fontFamily="var(--font-display)" fontWeight="700">{score}</text>
    </svg>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    Promise.all([
      apiGetMyAnalyses({ page, sort }),
      apiGetScoreHistory(30),
    ]).then(([data, hist]) => {
      setAnalyses(data.analyses);
      setTotalPages(data.pages);
      setHistory(hist.map(h => ({
        ...h,
        date: new Date(h.recorded_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      })));
    }).finally(() => setLoading(false));
  }, [page, sort]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this analysis?')) return;
    await apiDeleteAnalysis(id);
    setAnalyses(a => a.filter(x => x.id !== id));
  };

  const handleToggleVisibility = async (id, currentState) => {
  try {
    await apiToggleVisibility(id, !currentState);

    setAnalyses(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, is_public: !currentState }
          : a
      )
    );
  } catch (err) {
    console.error(err);
    alert('Failed to update visibility');
  }
};

const handleRename = async (id, currentTitle) => {
  const newTitle = prompt('Enter new title:', currentTitle);

  if (!newTitle || !newTitle.trim()) return;

  try {
    await apiRenameAnalysis(id, newTitle);

    setAnalyses(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, title: newTitle }
          : a
      )
    );
  } catch (err) {
    console.error(err);
    alert('Failed to rename analysis');
  }
};

const handleDeleteAccount = async () => {
  const confirmed = window.confirm(
    'Are you sure you want to permanently delete your account? This action cannot be undone.'
  );

  if (!confirmed) return;

  try {
    await apiDeleteAccount();

    localStorage.removeItem('ca_token');

    alert('Account deleted successfully.');

    window.location.href = '/';
  } catch (err) {
    console.error(err);
    alert('Failed to delete account.');
  }
};

  if (loading) return <div className="dashboard-loading"><div className="spinner"/></div>;

  return (
    <div className="dashboard">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">My Portfolio</h1>
            <p className="dashboard-sub">
              {user.analysis_count} shot{user.analysis_count !== 1 ? 's' : ''} analyzed
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
  <Link to="/analyze" className="btn btn-primary btn-sm">
    + New Analysis
  </Link>

  <button
    className="btn btn-secondary btn-sm"
    onClick={handleDeleteAccount}
    style={{
      background: '#c62828',
      color: '#fff',
      border: 'none'
    }}
  >
    Delete Account
  </button>
</div>
</div>

        {/* Stats bar */}
        <div className="dash-stats">
          {[
            { label: 'Total shots', value: user.analysis_count || 0 },
            { label: 'Followers', value: user.follower_count || 0 },
            { label: 'Following', value: user.following_count || 0 },
          ].map(s => (
            <div key={s.label} className="dash-stat">
              <span className="dash-stat-val">{s.value}</span>
              <span className="dash-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Score trend chart */}
        {history.length > 1 && (
          <div className="dash-chart-card">
            <h3 className="dash-section-title">Score Trend — Last 30 Days</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={history} margin={{ top: 8, right: 16, bottom: 8, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)"/>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}/>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)' }}
                  labelStyle={{ color: 'var(--text-secondary)', fontSize: 11 }}
                />
                <Line type="monotone" dataKey="overall_score" stroke="var(--accent-primary)" strokeWidth={2} dot={{ fill: 'var(--accent-primary)', r: 3 }} activeDot={{ r: 5 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Analyses grid */}
        <div className="dash-analyses-header">
          <h3 className="dash-section-title">Saved Analyses</h3>
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} className="dash-sort">
            <option value="newest">Newest first</option>
            <option value="score">Highest score</option>
          </select>
        </div>

        {analyses.length === 0 ? (
          <div className="dash-empty">
            <p>No analyses yet.</p>
            <Link to="/analyze" className="btn btn-primary btn-sm">Analyze your first shot</Link>
          </div>
        ) : (
          <div className="analyses-grid">
            {analyses.map(a => (
              <div key={a.id} className="analysis-card">
                <Link to={`/analysis/${a.id}`} className="analysis-card-img-wrap">
                  <img src={a.image_url} alt={a.title} loading="lazy"/>
                  <div className="analysis-card-overlay">
                    <ScoreRing score={a.overall_score}/>
                  </div>
                </Link>
                <div className="analysis-card-body">
                  <div className="analysis-card-meta">
                    {a.genre && <span className="analysis-tag">{a.genre}</span>}
                    {!a.is_public && <span className="analysis-tag analysis-tag--private">Private</span>}
                  </div>
                  <h4 className="analysis-card-title">{a.title}</h4>
                  <p className="analysis-card-verdict">{a.verdict}</p>
                  <div className="analysis-card-actions">
  <Link to={`/analysis/${a.id}`} className="analysis-action">
    View
  </Link>

  <button
  className="analysis-action"
  onClick={() => handleRename(a.id, a.title)}
>
  Rename
</button>

  <button
    className="analysis-action"
    onClick={() => handleToggleVisibility(a.id, a.is_public)}
  >
    {a.is_public ? '🔓 Public' : '🔒 Private'}
  </button>

  <button
    className="analysis-action analysis-action--delete"
    onClick={() => handleDelete(a.id)}
  >
    Delete
  </button>
</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="dash-pagination">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn btn-secondary btn-sm">← Prev</button>
            <span className="page-info">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="btn btn-secondary btn-sm">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
