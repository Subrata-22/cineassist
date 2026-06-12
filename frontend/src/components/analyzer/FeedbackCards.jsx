import { MODULE_ICONS, MODULE_COLORS, getScoreColor } from '../../utils/constants';
import './FeedbackCards.css';

export default function FeedbackCards({ modules }) {
  if (!modules) return null;

  return (
    <div className="feedback-section">
      <h3 className="feedback-section-title">
        <span className="section-tag">Detailed Breakdown</span>
      </h3>
      <div className="feedback-grid">
        {modules.map((mod, i) => {
          const color = MODULE_COLORS[mod.name] || 'var(--accent-cyan)';
          return (
            <div
              key={mod.name}
              className="feedback-card"
              style={{ animationDelay: `${0.2 + i * 0.1}s` }}
            >
              <div className="feedback-card-header">
                <div className="feedback-card-icon" style={{ background: `${color}15`, color }}>
                  {MODULE_ICONS[mod.name] || '●'}
                </div>
                <div className="feedback-card-title">{mod.name}</div>
                <div className="feedback-card-score" style={{ color: getScoreColor(mod.score) }}>
                  {mod.score}/100
                </div>
              </div>
              <p className="feedback-card-text">{mod.feedback}</p>
              <div className="feedback-suggestion">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
                {mod.suggestion}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
