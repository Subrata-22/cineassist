import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGetChallenges, apiGetChallenge, apiSubmitChallenge, apiVoteSubmission, apiGetMyAnalyses } from '../../services/api.js';
import { useAuth } from '../../store/AuthContext.jsx';
import './Challenges.css';

function ChallengeCard({ challenge, onClick }) {
  const now = new Date();
  const end = new Date(challenge.end_date);
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

  return (
    <div className="challenge-card" onClick={onClick}>
      <div className="challenge-card-banner">
  {challenge.banner_url ? (
    <img
      src={challenge.banner_url}
      alt={challenge.title}
      className="challenge-banner-image"
    />
  ) : (
    <div className="challenge-banner-placeholder">
      🎯
    </div>
  )}
</div>
      <div className="challenge-card-top">
        <span className="challenge-theme">{challenge.theme || 'Open'}</span>
        <span className={`challenge-days${daysLeft < 3 ? ' urgent' : ''}`}>{daysLeft}d left</span>
      </div>
      <h3 className="challenge-card-title">{challenge.title}</h3>
      <p className="challenge-card-desc">{challenge.description}</p>
      <div className="challenge-card-footer">
        {challenge.focus_module && <span className="challenge-focus">Focus: {challenge.focus_module}</span>}
        <span className="challenge-subs">{challenge.submission_count} entries</span>
        {challenge.has_submitted && <span className="challenge-submitted">✓ Submitted</span>}
      </div>
    </div>
  );
}

export default function Challenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [active, setActive] = useState(null);
  const [myAnalyses, setMyAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState('');
  const [note, setNote] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  useEffect(() => {
    Promise.all([
      apiGetChallenges(),
      user ? apiGetMyAnalyses({ limit: 50 }) : Promise.resolve({ analyses: [] }),
    ]).then(([c, d]) => {
      setChallenges(c);
      setMyAnalyses(d.analyses);
    }).finally(() => setLoading(false));
  }, [user]);

  const openChallenge = async (c) => {
    const data = await apiGetChallenge(c.id);
    setActive(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAnalysisId) return;
    setSubmitting(true);
    try {
      await apiSubmitChallenge(active.challenge.id, { analysis_id: selectedAnalysisId, note });
      const data = await apiGetChallenge(active.challenge.id);
      setActive(data);
      setShowSubmitForm(false);
      setChallenges(c => c.map(x => x.id === active.challenge.id ? { ...x, has_submitted: true } : x));
    } catch (e) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const handleVote = async (subId) => {
    const result = await apiVoteSubmission(subId);
    setActive(a => ({
      ...a,
      submissions: a.submissions.map(s => s.id === subId
        ? { ...s, vote_count: parseInt(s.vote_count) + (result.voted ? 1 : -1), has_voted: result.voted }
        : s
      ),
    }));
  };

  if (loading) return <div className="ch-loading"><div className="spinner"/></div>;

  return (
    <div className="challenges-page">
      <div className="container">
        {!active ? (
          <>
            <div className="ch-header">
              <h1 className="ch-title">Weekly Challenges</h1>
              <p className="ch-sub">Put your composition skills to the test. Submit a shot, earn votes, climb the rankings.</p>
            </div>
            {challenges.length === 0 ? (
              <p className="ch-empty">No active challenges right now. Check back soon!</p>
            ) : (
              <div className="ch-grid">
                {challenges.map(c => <ChallengeCard key={c.id} challenge={c} onClick={() => openChallenge(c)}/>)}
              </div>
            )}
          </>
        ) : (
          <>
            <button className="ch-back" onClick={() => setActive(null)}>← Back to Challenges</button>
            <div className="ch-detail-header">
              <div>
                {active.challenge.theme && <span className="challenge-theme">{active.challenge.theme}</span>}
                <h1 className="ch-title">{active.challenge.title}</h1>
                <p className="ch-sub">{active.challenge.description}</p>
              </div>
              {user && !active.challenge.has_submitted && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowSubmitForm(true)}>Submit Shot</button>
              )}
            </div>

            {showSubmitForm && (
              <form className="ch-submit-form" onSubmit={handleSubmit}>
                <h4 className="ch-form-title">Submit Your Shot</h4>
                <select value={selectedAnalysisId} onChange={e => setSelectedAnalysisId(e.target.value)} className="ch-select" required>
                  <option value="">Select an analysis…</option>
                  {myAnalyses.map(a => (
                    <option key={a.id} value={a.id}>{a.title} ({a.overall_score}/100)</option>
                  ))}
                </select>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note about your shot…" className="comment-input" rows={2}/>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit'}</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowSubmitForm(false)}>Cancel</button>
                </div>
              </form>
            )}

            <div className="ch-submissions">
              <h3 className="ch-submissions-title">Submissions — {active.submissions.length} entries</h3>
              <div className="ch-submissions-grid">
                {active.submissions.map((sub, i) => (
                  <div key={sub.id} className={`ch-sub-card${i < 3 ? ' ch-sub-card--top' : ''}`}>
                    {i < 3 && <div className="ch-medal">#{i + 1}</div>}
                    <Link to={`/analysis/${sub.analysis_id}`}>
                      <img src={sub.image_url} alt={sub.title} className="ch-sub-img"/>
                    </Link>
                    <div className="ch-sub-body">
                      <div className="ch-sub-user">
                        <div className="user-avatar" style={{ width: 22, height: 22, fontSize: '0.6rem' }}>{sub.username[0].toUpperCase()}</div>
                        <Link to={`/user/${sub.username}`} className="user-name">@{sub.username}</Link>
                        <span className="ch-sub-score">{sub.overall_score}</span>
                      </div>
                      {sub.note && <p className="ch-sub-note">{sub.note}</p>}
                      <button
                        className={`ch-vote-btn${sub.has_voted ? ' voted' : ''}`}
                        onClick={() => user && handleVote(sub.id)}
                        disabled={!user}
                      >
                        ♥ {sub.vote_count}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
