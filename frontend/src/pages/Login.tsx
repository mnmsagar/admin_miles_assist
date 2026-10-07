import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Cpu, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@adminhub.com');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Cpu className="size-5" />
          </span>
          <span className="text-xl font-bold text-white">AdminHub</span>
        </div>
        <div className="card p-6">
          <h1 className="text-lg font-bold text-slate-900">Welcome back</h1>
          <p className="mb-5 text-sm text-slate-500">
            Sign in to your admin console
          </p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-[13px] font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="rounded-lg bg-error-light px-3 py-2 text-[13px] text-red-700">
                {error}
              </p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Sign in
            </button>
          </form>
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
            Demo admin: <b>admin@adminhub.com</b> / <b>Admin@12345</b>
          </p>
        </div>
      </div>
    </div>
  );
}
