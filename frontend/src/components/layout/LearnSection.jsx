import { useEffect, useRef } from 'react';
import './LearnSection.css';

const articles = [
  {
    tag: 'Composition',
    title: 'The Rule of Thirds',
    desc: 'Dividing the frame into a 3×3 grid and placing subjects at intersections creates tension and energy that a centered composition lacks.',
    demo: 'thirds',
    readTime: '3 min',
  },
  {
    tag: 'Geometry',
    title: 'Golden Ratio',
    desc: 'Nature\'s perfect proportion — 1:1.618 — creates a spiral that guides the eye naturally. Used by master painters and filmmakers alike.',
    demo: 'golden',
    readTime: '4 min',
  },
  {
    tag: 'Depth',
    title: 'Depth & Layering',
    desc: 'Foreground, midground, and background layers create a sense of three-dimensional space, pulling the viewer into the scene.',
    demo: 'depth',
    readTime: '3 min',
  },
  {
    tag: 'Framing',
    title: 'Natural Framing',
    desc: 'Using elements within the scene — doorways, trees, shadows — to frame your subject adds context and draws focus naturally.',
    demo: 'framing',
    readTime: '5 min',
  },
];

function Demo({ type }) {
  switch (type) {
    case 'thirds':
      return (
        <div className="demo-thirds">
          {[...Array(9)].map((_, i) => (
            <div key={i} className={`demo-cell${[2, 4, 6, 8].includes(i) ? ' demo-cell--intersect' : ''}`}>
              {[2, 4, 6, 8].includes(i) && <span className="demo-dot" />}
            </div>
          ))}
        </div>
      );
    case 'golden':
      return (
        <div className="demo-golden">
          <div className="demo-spiral" />
          <div className="demo-spiral-inner" />
        </div>
      );
    case 'depth':
      return (
        <div className="demo-depth">
          <div className="demo-layer demo-layer--bg" />
          <div className="demo-layer demo-layer--mid" />
          <div className="demo-layer demo-layer--fg" />
        </div>
      );
    case 'framing':
      return (
        <div className="demo-framing">
          <div className="demo-frame-outer">
            <div className="demo-frame-inner">
              <div className="demo-subject" />
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}

export default function LearnSection() {
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
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    cardsRef.current.forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  return (
    <section className="section learn-section" id="learn">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Learn</span>
          <h2 className="section-title">
            Theory Behind<br />Great Shots
          </h2>
          <p className="section-desc">
            Deep dives into the principles that define cinematic visual language.
          </p>
        </div>

        <div className="learn-grid">
          {articles.map((art, i) => (
            <div
              key={art.title}
              className="learn-card"
              ref={el => cardsRef.current[i] = el}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className="learn-demo">
                <Demo type={art.demo} />
              </div>
              <div className="learn-card-body">
                <div className="learn-card-meta">
                  <span className="learn-tag">{art.tag}</span>
                  <span className="learn-read-time">{art.readTime} read</span>
                </div>
                <h3 className="learn-card-title">{art.title}</h3>
                <p className="learn-card-desc">{art.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
