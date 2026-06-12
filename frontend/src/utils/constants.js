export const MODULE_ICONS = {
  'Rule of Thirds': '⊞',
  'Visual Balance': '⚖',
  'Symmetry': '⟷',
  'Color Harmony': '🎨',
  'Brightness & Contrast': '☀',
  'Leading Lines': '↗'
};

export const MODULE_COLORS = {
  'Rule of Thirds': 'var(--accent-cyan)',
  'Visual Balance': 'var(--accent-amber)',
  'Symmetry': 'var(--accent-purple)',
  'Color Harmony': 'var(--accent-green)',
  'Brightness & Contrast': 'var(--text-primary)',
  'Leading Lines': 'var(--accent-red)'
};

export const ANALYSIS_STEPS = [
  { key: 'thirds', label: 'Rule of Thirds' },
  { key: 'balance', label: 'Visual Balance' },
  { key: 'symmetry', label: 'Symmetry' },
  { key: 'color', label: 'Color Harmony' },
  { key: 'brightness', label: 'Brightness' },
  { key: 'edges', label: 'Edge Detection' },
];

export function getScoreColor(score) {
  if (score >= 75) return 'var(--accent-cyan)';
  if (score >= 50) return 'var(--accent-amber)';
  return 'var(--accent-red)';
}
