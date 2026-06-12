import { useEffect, useRef } from 'react';
import { MODULE_ICONS, MODULE_COLORS, getScoreColor } from '../../utils/constants';
import './ScorePanel.css';

const CIRCUMFERENCE = 326.7;

export default function ScorePanel({ results }) {
  const ringRef = useRef(null);
  const scoreRef = useRef(null);

  useEffect(() => {
    if (!results) return;
    const target = results.overall;
    const duration = 1500;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      if (scoreRef.current) scoreRef.current.textContent = current;
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = CIRCUMFERENCE - (CIRCUMFERENCE * current / 100);
      }
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [results]);

  if (!results) return null;

  return (
    <div className="score-panel">
      {/* Overall score ring */}
      <div className="overall-score-section">
        <div className="score-ring-container">
          <svg viewBox="0 0 120 120" width="120" height="120" className="score-ring-svg">
            <circle cx="60" cy="60" r="52" stroke="var(--bg-elevated)" strokeWidth="6" fill="none" />
            <circle
              ref={ringRef}
              cx="60" cy="60" r="52"
              stroke="var(--accent-primary)"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', filter: 'drop-shadow(0 0 8px var(--accent-primary-glow))' }}
            />
          </svg>
          <div className="score-ring-inner">
            <span ref={scoreRef} className="overall-score-num">0</span>
            <span className="score-max">/100</span>
          </div>
        </div>
        <div className="score-verdict-block">
          <p className="score-verdict-label">Overall Score</p>
          <h3 className="score-verdict-text">{results.verdict}</h3>
        </div>
      </div>

      {/* Module score bars */}
      <div className="module-scores">
        {results.modules.map((mod, i) => {
          const color = MODULE_COLORS[mod.name] || 'var(--accent-cyan)';
          return (
            <div key={mod.name} className="module-score-card" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
              <div className="module-icon" style={{ background: `${color}15`, color }}>
                {MODULE_ICONS[mod.name] || '●'}
              </div>
              <div className="module-info">
                <div className="module-name">{mod.name}</div>
                <div className="module-bar-bg">
                  <div
                    className="module-bar-fill"
                    style={{
                      background: color,
                      width: '0%',
                      transition: `width 0.8s var(--ease-out) ${0.2 + i * 0.1}s`
                    }}
                    ref={(el) => { if (el) setTimeout(() => { el.style.width = `${mod.score}%`; }, 50); }}
                  />
                </div>
              </div>
              <div className="module-score-val" style={{ color: getScoreColor(mod.score) }}>
                {mod.score}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
