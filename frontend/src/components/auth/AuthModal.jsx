import { useState } from 'react';
import { useAuth } from '../../store/AuthContext.jsx';
import './AuthModal.css';

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}>✕</button>

        <div className="auth-logo">
          <svg viewBox="0 0 32 32" width="28" height="28">
            <circle cx="16" cy="16" r="14" stroke="var(--accent-primary)" strokeWidth="2" fill="none" opacity="0.4"/>
            <circle cx="16" cy="16" r="9" stroke="var(--accent-primary)" strokeWidth="2" fill="none"/>
            <circle cx="16" cy="16" r="4" fill="var(--accent-primary)"/>
          </svg>
          <span>CineAssist</span>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>Sign In</button>
          <button className={`auth-tab${mode === 'register' ? ' active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>Create Account</button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <div className="auth-field">
              <label>Username</label>
              <input name="username" value={form.username} onChange={handle} placeholder="your_username" required autoComplete="username"/>
            </div>
          )}
          <div className="auth-field">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handle} placeholder="you@example.com" required autoComplete="email"/>
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={handle} placeholder={mode === 'register' ? 'Min. 8 characters' : '••••••••'} required autoComplete={mode === 'register' ? 'new-password' : 'current-password'}/>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
