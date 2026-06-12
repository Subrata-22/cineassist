import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  apiGetUserProfile,
  apiGetUserAnalyses,
  apiFollowUser
} from '../../services/api.js';
import { useAuth } from '../../store/AuthContext.jsx';
import './UserProfile.css';

export default function UserProfile() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  

  useEffect(() => {
    Promise.all([
      apiGetUserProfile(username),
      apiGetUserAnalyses(username),
    ]).then(([p, a]) => {
      setProfile(p);
      setAnalyses(a);
      setFollowing(p.is_following);
    }).finally(() => setLoading(false));
  }, [username]);

  const handleFollow = async () => {
    if (!me) return;
    const result = await apiFollowUser(profile.id);
    setFollowing(result.following);
    setProfile(p => ({
      ...p,
      follower_count: parseInt(p.follower_count) + (result.following ? 1 : -1),
    }));
  };


  if (loading) return <div className="profile-loading"><div className="spinner"/></div>;
  if (!profile) return <div className="profile-loading"><p>User not found.</p></div>;

  const isOwn = me?.id === profile.id;

  return (
    <div className="user-profile">
      <div className="container">
        {/* Cover / header */}
        <div className="profile-header">
         <div className="profile-avatar-lg">
  {profile.avatar_url ? (
    <img
      src={profile.avatar_url}
      alt="avatar"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '50%'
      }}
    />
  ) : (
    profile.username[0].toUpperCase()
  )}
</div>
          <div className="profile-info">
            <h1 className="profile-username">@{profile.username}</h1>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-stats">
              <span><strong>{profile.analysis_count}</strong> shots</span>
              <Link
  to={`/user/${profile.username}/followers`}
  className="profile-stat-btn"
>
  <strong>{profile.follower_count}</strong> followers
</Link>

<Link
  to={`/user/${profile.username}/following`}
  className="profile-stat-btn"
>
  <strong>{profile.following_count}</strong> following
</Link>
              {profile.avg_score > 0 && <span><strong>{profile.avg_score}</strong> avg score</span>}
            </div>
          </div>
          <div className="profile-actions">
            {isOwn ? (
             <Link to="/settings" className="btn btn-secondary btn-sm">
  Edit Profile
</Link>
            ) : me ? (
              <button
                className={`btn btn-sm ${following ? 'btn-secondary' : 'btn-primary'}`}
                onClick={handleFollow}
              >
                {following ? 'Unfollow' : 'Follow'}
              </button>
            ) : null}
          </div>
        </div>

        {/* Analyses */}
        {analyses.length === 0 ? (
          <div className="profile-empty">
            <p>No public shots yet.</p>
          </div>
        ) : (
          <div className="profile-grid">
            {analyses.map(a => (
              <Link key={a.id} to={`/analysis/${a.id}`} className="profile-shot">
                <img src={a.image_url} alt={a.title} loading="lazy"/>
                <div className="profile-shot-overlay">
                  <span className="profile-shot-score">{a.overall_score}</span>
                  {a.genre && <span className="profile-shot-genre">{a.genre}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
