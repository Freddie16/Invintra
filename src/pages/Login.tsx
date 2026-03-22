import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, ShieldCheck, AlertCircle } from 'lucide-react';
import { loginWithGoogle, loginWithEmail } from '../firebase';
import { useNavigate } from 'react-router-dom';

/** Maps Firebase Auth error codes to human-readable messages. */
function getAuthErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    switch ((err as { code: string }).code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect username/email or password. Please try again.';
      case 'auth/invalid-email':
        return 'That username was not found. Please check your credentials.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please wait a moment before trying again.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        break;
    }
  }
  if (err instanceof Error) return err.message;
  return 'Login failed. Please try again.';
}

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // loginWithEmail now handles both plain usernames and email addresses.
      // For bare usernames it performs a Firestore lookup to resolve the
      // associated email before calling Firebase Auth, which avoids the
      // 400 INVALID_EMAIL error that was occurring before.
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">QuantBot Pro</h1>
          <p className="text-slate-500">Institutional-grade algorithmic trading</p>
        </div>

        <div className="glass-card p-8 space-y-6">
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Username / Email</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Enter username or email"
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-sm">
                <AlertCircle size={18} />
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
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full py-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-3 font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
            Google Account
          </button>
        </div>

        <p className="text-center text-xs text-slate-400">
          Super Admin? Use your provided credentials for lifetime access.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;