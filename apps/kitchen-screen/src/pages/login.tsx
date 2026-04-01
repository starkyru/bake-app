import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@bake-app/react/auth';
import { ChefHat } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/queue', { replace: true });
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await login(email, password);
      navigate('/queue');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D1B2A] px-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#16213E] p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500/20">
            <ChefHat className="h-8 w-8 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Kitchen Display</h1>
          <p className="text-sm text-gray-400">Sign in to view orders</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-white/10 bg-[#0D1B2A] px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors"
              placeholder="chef@bakery.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-[#0D1B2A] px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors"
              placeholder="********"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-2 rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
