import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGetPublicFeed, apiGetLeaderboard, apiToggleLike } from '../../services/api.js';
import { useAuth } from '../../store/AuthContext.jsx';
import './Explore.css';

const GENRES = ['All'];

export default function Explore() {
  const { user } = useAuth();
  const [tab, setTab] = useState('feed');
  const [analyses, setAnalyses] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [genre, setGenre] = useState('');
  const [lbType, setLbType] = useState('top_score');
  const [lbPeriod, setLbPeriod] = useState('all');

  useEffect(() => {
    setLoading(true);
    if (tab === 'feed') {
      apiGetPublicFeed({ sort})
        .then(d => setAnalyses(d.analyses))
        .finally(() => setLoading(false));
    } else {
      apiGetLeaderboard({ type: lbType, period: lbPeriod })
        .then(setLeaderboard)
        .finally(() => setLoading(false));
    }
  }, [tab, sort, genre, lbType, lbPeriod]);

  const handleLike = async (id) => {
    if (!user) return;
    const result = await apiToggleLike(id);
    setAnalyses(a => a.map(x => x.id === id
      ? { ...x, like_count: parseInt(x.like_count) + (result.liked ? 1 : -1) }
      : x
    ));
  };

  return (
    <div className="explore">
      <div className="container">
        <div className="explore-header">
          <h1 className="explore-title">Explore</h1>
          <div className="explore-tabs">
            <button className={`explore-tab${tab === 'feed' ? ' active' : ''}`} onClick={() => setTab('feed')}>Community Feed</button>
            <button className={`explore-tab${tab === 'leaderboard' ? ' active' : ''}`} onClick={() => setTab('leaderboard')}>Leaderboard</button>
          </div>
        </div>

        {tab === 'feed' && (
          <>
            <div className="explore-filters">
              <div className="genre-pills">
                {GENRES.map(g => (
                  <button key={g} className={`genre-pill${genre === (g === 'All' ? '' : g) ? ' active' : ''}`}
                    onClick={() => setGenre(g === 'All' ? '' : g)}>{g}</button>
                ))}
              </div>
              <select value={sort} onChange={e => setSort(e.target.value)} className="explore-sort">
                <option value="newest">Newest</option>
                <option value="top">Top Scored</option>
                <option value="popular">Most Liked</option>
              </select>
            </div>

            {loading ? <div className="explore-loading"><div className="spinner"/></div> : (
              <div className="explore-grid">
                {analyses.map(a => (
                  <div key={a.id} className="explore-card">
                    <Link to={`/analysis/${a.id}`} className="explore-card-img">
                      <img src={a.image_url} alt={a.title} loading="lazy"/>
                      <div className="explore-score">{a.overall_score}</div>
                    </Link>
                    <div className="explore-card-body">
                      <div className="explore-card-user">
                        <div className="user-avatar">{a.username[0].toUpperCase()}</div>
                        <Link to={`/user/${a.username}`} className="user-name">@{a.username}</Link>
                        {a.genre && <span className="explore-genre">{a.genre}</span>}
                      </div>
                      <h4 className="explore-card-title">{a.title}</h4>
                      <div className="explore-card-footer">
                        <button className="explore-like" onClick={() => handleLike(a.id)} disabled={!user}>
                          ♥ {a.like_count}
                        </button>
                        <span className="explore-comments">💬 {a.comment_count}</span>
                        <span className="explore-views">👁 {a.view_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'leaderboard' && (
          <>
            <div className="lb-filters">
              <div className="lb-type-pills">
                {[['top_score','Best Shot'],['avg_score','Avg Score'],['most_analyses','Most Active']].map(([k,v]) => (
                  <button key={k} className={`genre-pill${lbType === k ? ' active' : ''}`} onClick={() => setLbType(k)}>{v}</button>
                ))}
              </div>
              <div className="lb-period-pills">
                {[['all','All Time'],['month','This Month'],['week','This Week']].map(([k,v]) => (
                  <button key={k} className={`genre-pill genre-pill--sm${lbPeriod === k ? ' active' : ''}`} onClick={() => setLbPeriod(k)}>{v}</button>
                ))}
              </div>
            </div>

            {loading ? <div className="explore-loading"><div className="spinner"/></div> : (
              <div className="leaderboard-list">
                {leaderboard.map((u, i) => (
                  <div key={u.id} className="lb-row">
                    <span className={`lb-rank${i < 3 ? ` lb-rank--${i+1}` : ''}`}>#{i + 1}</span>
                    <div className="user-avatar lb-avatar">{u.username[0].toUpperCase()}</div>
                    <Link to={`/user/${u.username}`} className="lb-username">@{u.username}</Link>
                    <div className="lb-stats">
                      <span className="lb-stat"><strong>{u.best_score}</strong> best</span>
                      <span className="lb-stat"><strong>{u.avg_score}</strong> avg</span>
                      <span className="lb-stat"><strong>{u.analysis_count}</strong> shots</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
