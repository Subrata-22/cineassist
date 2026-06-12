import './Hero.css';

const stats = [
  { value: '6', label: 'Analysis Modules' },
  { value: '100%', label: 'Client-Side' },
  { value: '<2s', label: 'Analysis Time' },
];

export default function Hero({ onUploadClick }) {
  const scrollToAnalyzer = () => {
    document.getElementById('analyzer')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-grid" />
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
      </div>

      <div className="container hero-content">
        <div className="hero-badge animate-fade-in">
          <span className="badge-dot" />
          Shot Composition AI
        </div>

        <h1 className="hero-title animate-fade-in-up delay-1">
          See Your Frame<br />
          <span className="text-gradient">Like a Director</span>
        </h1>

        <p className="hero-desc animate-fade-in-up delay-2">
          Upload any photograph or film still. CineAssist analyzes composition,
          balance, color harmony, and leading lines — giving you professional
          cinematography feedback instantly.
        </p>

        <div className="hero-actions animate-fade-in-up delay-3">
          <button className="btn btn-primary" onClick={() => { scrollToAnalyzer(); setTimeout(onUploadClick, 500); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Analyze a Shot
          </button>
          <button className="btn btn-secondary" onClick={scrollToAnalyzer}>
            See How It Works
          </button>
        </div>

        <div className="hero-stats animate-fade-in-up delay-4">
          {stats.map((stat, i) => (
            <div key={i} className="hero-stat">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="hero-scroll-indicator">
        <span className="scroll-label">Scroll</span>
        <div className="scroll-track">
          <div className="scroll-wheel" />
        </div>
      </div>
    </section>
  );
}
