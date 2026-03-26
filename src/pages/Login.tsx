import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, ShieldCheck, AlertCircle, Sun, Moon } from 'lucide-react';
import { loginWithGoogle, loginWithEmail } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

function getAuthErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    switch ((err as { code: string }).code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect username/email or password.';
      case 'auth/invalid-email':
        return 'Username not found. Please check your credentials.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Contact support.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait before trying again.';
      case 'auth/network-request-failed':
        return 'Network error. Check your internet connection.';
    }
  }
  if (err instanceof Error) return err.message;
  return 'Login failed. Please try again.';
}

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const navigate                = useNavigate();
  const { theme, toggleTheme }  = useTheme();

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithEmail(username.trim(), password);
      navigate('/');
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: 'var(--bg)' }}>
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-xl transition-all"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-8">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>QuantBot Pro</h1>
          <p style={{ color: 'var(--text-muted)' }}>Institutional-grade algorithmic trading</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 space-y-6">
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest block" style={{ color: 'var(--text-muted)' }}>
                Username / Email
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                placeholder="Enter username or email"
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest block" style={{ color: 'var(--text-muted)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl flex items-center gap-3 text-sm"
                style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: 'var(--color-danger)' }}>
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? 'Authenticating...' : <><LogIn size={20} /> Sign In</>}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid var(--border)' }} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-4 text-xs font-bold tracking-widest" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
                Or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all"
            style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
            Google Account
          </button>
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--text-dim)' }}>
          Super Admin? Use your provided credentials for lifetime access.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;