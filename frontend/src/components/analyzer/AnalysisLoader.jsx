import { ANALYSIS_STEPS } from '../../utils/constants';
import './AnalysisLoader.css';

export default function AnalysisLoader({ currentStep }) {
  const currentIndex = ANALYSIS_STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="analysis-loader">
      <div className="loader-spinner">
        <svg viewBox="0 0 80 80" width="80" height="80">
          <circle cx="40" cy="40" r="34" stroke="var(--border-mid)" strokeWidth="3" fill="none" />
          <circle
            cx="40" cy="40" r="34"
            stroke="var(--accent-primary)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="213.6"
            strokeDashoffset="160"
            style={{ animation: 'spin 1.4s linear infinite', transformOrigin: 'center' }}
          />
        </svg>
        <div className="loader-icon">⊞</div>
      </div>

      <h3 className="loader-title">Analyzing Composition</h3>
      <p className="loader-sub">Running {ANALYSIS_STEPS.length} analysis modules…</p>

      <div className="loader-steps">
        {ANALYSIS_STEPS.map((step, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          return (
            <div
              key={step.key}
              className={`loader-step${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}
            >
              <span className="step-indicator">
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isActive ? (
                  <span className="step-dot-pulse" />
                ) : (
                  <span className="step-dot" />
                )}
              </span>
              <span className="step-label">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
