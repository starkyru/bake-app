import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useCustomerAuth } from '@bake-app/react/customer-auth';
import { toast } from 'sonner';
import { useTheme } from '../providers/theme-provider';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useCustomerAuth();
  const { businessName } = useTheme();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) return;

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      await register({
        firstName,
        lastName,
        email,
        password,
        phone: phone || undefined,
      });
      toast.success('Account created! Welcome!');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  const inputStyle = {
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--color-card)',
    color: 'var(--color-text)',
    '--tw-ring-color': 'var(--color-primary)',
  } as React.CSSProperties;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1 text-sm font-medium hover:underline"
        style={{ color: 'var(--color-primary)' }}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
        Create your account
      </h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Join {businessName} to track orders and save your favorites.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="given-name"
              className="h-11 w-full border border-black/10 px-3 text-sm outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              autoComplete="family-name"
              className="h-11 w-full border border-black/10 px-3 text-sm outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="h-11 w-full border border-black/10 px-3 text-sm outline-none focus:ring-2"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-11 w-full border border-black/10 px-3 pr-10 text-sm outline-none focus:ring-2"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
              ) : (
                <Eye className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Phone (optional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            autoComplete="tel"
            className="h-11 w-full border border-black/10 px-3 text-sm outline-none focus:ring-2"
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 h-11 font-semibold text-white transition-colors disabled:opacity-50"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-primary)',
          }}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-medium hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
