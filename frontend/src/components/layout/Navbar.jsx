import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  BellDot
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext.jsx';
import {
  apiGetNotifications,
  apiSearchUsers
} from '../../services/api.js';
import './Navbar.css';

export default function Navbar({ onAuthClick, fileInputRef }) {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] =
  useState('');
const [results, setResults] =
  useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const handleLogout = () => {
  logout();
  navigate('/login', { replace: true });
};

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
useEffect(() => {
  if (!user) return;

  const loadNotifications = async () => {
    try {
      const data = await apiGetNotifications();

      const unread = data.filter(n => !n.is_read).length;

      setUnreadCount(unread);
    } catch (err) {
      console.error(err);
    }
  };

  loadNotifications();

  const interval = setInterval(loadNotifications, 30000);

  return () => clearInterval(interval);
}, [user]);
  const handleAnalyze = () => {
    navigate('/');
    setTimeout(() => {
      document.getElementById('analyzer')?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => fileInputRef?.current?.click(), 500);
    }, 100);
  };

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <svg viewBox="0 0 32 32" width="26" height="26" className="logo-icon">
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3"/>
            <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
            <circle cx="16" cy="16" r="4" fill="currentColor"/>
            <line x1="16" y1="0" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
            <line x1="16" y1="26" x2="16" y2="32" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
            <line x1="0" y1="16" x2="6" y2="16" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
            <line x1="26" y1="16" x2="32" y2="16" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
          </svg>
          <span>CineAssist</span>
        </Link>

        <ul className="nav-links">
          <li><Link to="/explore" className="nav-link">Explore</Link></li>
          <li><Link to="/challenges" className="nav-link">Challenges</Link></li>
          {user && <>
            <li><Link to="/compare" className="nav-link">Compare</Link></li>
            <li><Link to="/storyboard" className="nav-link">Storyboard</Link></li>
          </>}
        </ul>

        <div className="nav-search-wrapper">
  <button
    className="nav-search-btn"
    onClick={() => {
      setSearchOpen(!searchOpen);

      if (searchOpen) {
        setSearch('');
        setResults([]);
      }
    }}
  >
    <Search
  size={18}
  strokeWidth={2}
/>
  </button>

  {searchOpen && (
    <div className="nav-search">
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={async (e) => {
          const value = e.target.value;

          setSearch(value);

          if (!value.trim()) {
            setResults([]);
            return;
          }

          const users =
            await apiSearchUsers(value);

          setResults(users);
        }}
      />

      {results.length > 0 && (
        <div className="search-dropdown">
          {results.map(user => (
            <Link
              key={user.id}
              to={`/user/${user.username}`}
              onClick={() => {
                setSearch('');
                setResults([]);
                setSearchOpen(false);
              }}
            >
              @{user.username}
            </Link>
          ))}
        </div>
      )}
    </div>
  )}
</div>

        <div className="nav-right">
          <button className="nav-cta" onClick={handleAnalyze}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Analyze
          </button>

         {user ? (
  <div className="nav-user">

    <Link
  to="/notifications"
  className="nav-notification"
  title="Notifications"
>
  <BellDot size={18} />

  {unreadCount > 0 && (
    <span className="notification-badge">
      {unreadCount}
    </span>
  )}
</Link>

<Link
  to="/dashboard"
  className="nav-dashboard-btn"
>
  Dashboard
</Link>

{user?.role === 'admin' && (
  <Link
    to="/admin/analytics"
    className="nav-dashboard-btn"
  >
    Admin
  </Link>
)}

    <Link
  to={`/user/${user.username}`}
  className="nav-avatar"
>
  {user.avatar_url ? (
    <img
      src={user.avatar_url}
      alt="avatar"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '50%'
      }}
    />
  ) : (
    user.username[0].toUpperCase()
  )}
</Link>

    <button className="nav-logout" onClick={handleLogout} title="Sign out">
      ⏻
    </button>

  </div>
) : (
            <button className="nav-signin" onClick={onAuthClick}>Sign In</button>
          )}
        </div>
      </div>
    </nav>
  );
}
