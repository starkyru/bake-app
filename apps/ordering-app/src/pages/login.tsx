import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Phone, Globe, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useCustomerAuth } from '@bake-app/react/customer-auth';
import { toast } from 'sonner';
import { useTheme } from '../providers/theme-provider';

type Tab = 'email' | 'phone' | 'social';

export function LoginPage() {
  const navigate = useNavigate();
  const { loginWithEmail, loginWithPhone, verifyOtp, loginWithSocial, isLoading } =
    useCustomerAuth();
  const { businessName } = useTheme();

  const [tab, setTab] = useState<Tab>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      await loginWithEmail(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleSendOtp = async () => {
    if (!phone) return;
    try {
      await loginWithPhone(phone);
      setOtpSent(true);
      toast.success('Verification code sent');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send code');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !otp) return;
    try {
      await verifyOtp(phone, otp);
      toast.success('Welcome!');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid code');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    try {
      // In a real implementation, this would open an OAuth flow
      // For now, show a placeholder message
      toast.info(`${provider} sign-in will be available soon`);
      // await loginWithSocial(provider, socialToken);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Social login failed');
    }
  };

  const tabs = [
    { key: 'email' as Tab, label: 'Email', icon: Mail },
    { key: 'phone' as Tab, label: 'Phone', icon: Phone },
    { key: 'social' as Tab, label: 'Social', icon: Globe },
  ];

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1 text-sm font-medium hover:underline"
        style={{ color: 'var(--color-primary)' }}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
        Sign in to {businessName}
      </h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Track orders, save favorites, and more.
      </p>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-full p-1" style={{ backgroundColor: 'var(--color-surface)' }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: tab === key ? 'var(--color-card)' : 'transparent',
              color: tab === key ? 'var(--color-text)' : 'var(--color-text-muted)',
              boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Email tab */}
      {tab === 'email' && (
        <form onSubmit={handleEmailLogin} className="mt-6 flex flex-col gap-4">
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
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-card)',
                color: 'var(--color-text)',
                '--tw-ring-color': 'var(--color-primary)',
              } as React.CSSProperties}
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
                placeholder="Enter password"
                required
                autoComplete="current-password"
                className="h-11 w-full border border-black/10 px-3 pr-10 text-sm outline-none focus:ring-2"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-card)',
                  color: 'var(--color-text)',
                  '--tw-ring-color': 'var(--color-primary)',
                } as React.CSSProperties}
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
          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs font-medium hover:underline"
              style={{ color: 'var(--color-primary)' }}
            >
              Forgot password?
            </button>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="h-11 font-semibold text-white transition-colors disabled:opacity-50"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-primary)',
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      )}

      {/* Phone tab */}
      {tab === 'phone' && (
        <div className="mt-6">
          {!otpSent ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  autoComplete="tel"
                  className="h-11 w-full border border-black/10 px-3 text-sm outline-none focus:ring-2"
                  style={{
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--color-card)',
                    color: 'var(--color-text)',
                    '--tw-ring-color': 'var(--color-primary)',
                  } as React.CSSProperties}
                />
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isLoading || !phone}
                className="h-11 font-semibold text-white transition-colors disabled:opacity-50"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-primary)',
                }}
              >
                {isLoading ? 'Sending...' : 'Send Code'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Enter the 6-digit code sent to {phone}
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoComplete="one-time-code"
                className="h-14 w-full border border-black/10 text-center font-mono text-2xl tracking-[0.5em] outline-none focus:ring-2"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-card)',
                  color: 'var(--color-text)',
                  '--tw-ring-color': 'var(--color-primary)',
                } as React.CSSProperties}
              />
              <button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="h-11 font-semibold text-white transition-colors disabled:opacity-50"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-primary)',
                }}
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                }}
                className="text-xs font-medium hover:underline"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Change phone number
              </button>
            </form>
          )}
        </div>
      )}

      {/* Social tab */}
      {tab === 'social' && (
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="flex h-11 items-center justify-center gap-2 border border-black/10 font-medium transition-colors hover:bg-gray-50"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-card)',
              color: 'var(--color-text)',
            }}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin('apple')}
            disabled={isLoading}
            className="flex h-11 items-center justify-center gap-2 font-medium text-white transition-colors"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: '#000',
            }}
          >
            <svg className="h-5 w-5" fill="white" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Continue with Apple
          </button>
        </div>
      )}

      {/* Register link */}
      <div className="mt-8 text-center">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="font-medium hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
