import { useEffect, useRef } from 'react';
import { MODULE_ICONS, MODULE_COLORS } from '../../utils/constants';
import './GuidanceSection.css';

const defaultCards = [
  {
    title: 'Rule of Thirds',
    icon: '⊞',
    color: 'var(--accent-cyan)',
    desc: 'Place subjects on grid intersections or along thirds lines to create dynamic, natural-feeling compositions that draw the eye.',
  },
  {
    title: 'Visual Balance',
    icon: '⚖',
    color: 'var(--accent-amber)',
    desc: 'Distribute visual weight evenly across the frame. Use negative space, color mass, and subject placement to achieve equilibrium.',
  },
  {
    title: 'Symmetry',
    icon: '⟷',
    color: 'var(--accent-purple)',
    desc: 'Symmetrical compositions convey stability and elegance. Even slight asymmetry can add tension and visual interest.',
  },
  {
    title: 'Color Harmony',
    icon: '🎨',
    color: 'var(--accent-green)',
    desc: 'Use complementary, analogous, or triadic color schemes. A cohesive palette unifies the frame and evokes specific emotions.',
  },
  {
    title: 'Lighting',
    icon: '☀',
    color: 'var(--text-primary)',
    desc: 'Direction, quality, and color of light shape mood dramatically. Hard light creates drama; soft light reveals texture and form.',
  },
  {
    title: 'Leading Lines',
    icon: '↗',
    color: 'var(--accent-red)',
    desc: 'Roads, fences, shadows, and architectural elements guide the viewer\'s eye through the frame and toward the subject.',
  },
];

export default function GuidanceSection({ analysisResults }) {
  const cardsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    cardsRef.current.forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [analysisResults]);

  // If we have analysis results, show personalized guidance
  const cards = analysisResults ? buildAnalysisCards(analysisResults) : defaultCards;

  return (
    <section className="section guidance-section" id="guide">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Guidance</span>
          <h2 className="section-title">
            {analysisResults ? 'Your Personalized\nGuidance' : 'Composition\nPrinciples'}
          </h2>
          <p className="section-desc">
            {analysisResults
              ? 'Areas to improve and strengths to maintain, ranked by priority.'
              : 'Master these six principles to elevate your cinematography and photography.'}
          </p>
        </div>

        <div className="guidance-mosaic">
          {cards.map((card, i) => (
            <div
              key={card.title + i}
              className={`guidance-card${card.isWeak ? ' guidance-card--weak' : ''}`}
              ref={el => cardsRef.current[i] = el}
              style={{ transitionDelay: `${(i % 6) * 0.07}s` }}
            >
              <div className="guidance-icon" style={{ '--icon-color': card.color, background: `${card.color}15` }}>
                <span>{card.icon || MODULE_ICONS[card.title] || '●'}</span>
              </div>
              <h4 className="guidance-card-title">{card.title}</h4>
              {card.status && (
                <p className="guidance-status" style={{ color: card.isWeak ? 'var(--accent-amber)' : 'var(--accent-cyan)' }}>
                  {card.status}
                </p>
              )}
              <p className="guidance-card-desc">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function buildAnalysisCards(results) {
  const weak = results.modules.filter(m => m.score < 65).sort((a, b) => a.score - b.score);
  const strong = results.modules.filter(m => m.score >= 65).sort((a, b) => b.score - a.score);
  return [
    ...weak.map(m => ({
      title: m.name,
      icon: MODULE_ICONS[m.name],
      color: MODULE_COLORS[m.name] || 'var(--accent-amber)',
      status: `⚠ Needs Improvement (${m.score}/100)`,
      desc: m.suggestion,
      isWeak: true,
    })),
    ...strong.map(m => ({
      title: m.name,
      icon: MODULE_ICONS[m.name],
      color: MODULE_COLORS[m.name] || 'var(--accent-cyan)',
      status: `✓ Strong (${m.score}/100)`,
      desc: m.suggestion,
      isWeak: false,
    })),
  ];
}
