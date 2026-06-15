import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <svg viewBox="0 0 32 32" width="20" height="20" className="footer-logo-icon">
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3"/>
            <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
            <circle cx="16" cy="16" r="4" fill="currentColor"/>
          </svg>
          CineAssist
        </div>
        <nav className="footer-links">
          <Link to="/explore">Explore</Link>
          <Link to="/challenges">Challenges</Link>
          <Link to="/compare">Compare</Link>
          <Link to="/storyboard">Storyboard</Link>
        </nav>
        <p className="footer-copy">All analysis runs in your browser. No images stored without your consent.</p>
      </div>
    </footer>
  );
}
