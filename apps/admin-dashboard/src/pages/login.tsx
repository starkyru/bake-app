import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@bake-app/react/auth';
import { Croissant, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const isFormValid = email.trim() !== '' && password.trim() !== '';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Login failed. Please check your credentials.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#faf3e8] px-4">
      <div className="w-full max-w-[420px] bg-white rounded-xl p-10 shadow-[0_8px_32px_rgba(139,69,19,0.12)]">
        {/* Header */}
        <div className="text-center mb-8">
          <Croissant className="mx-auto mb-2 text-[#8b4513]" size={56} strokeWidth={1.5} />
          <h1 className="text-[28px] font-bold text-[#8b4513] mb-1 font-['Inter',sans-serif]">
            Bake App
          </h1>
          <p className="text-sm text-[#8d6e63] m-0">Admin Dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-[#5d4037] mb-1.5">Email</label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d6e63]"
                size={18}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full pl-10 pr-4 py-3 border border-[#d7ccc8] rounded-lg text-sm
                  text-[#3e2723] placeholder-[#bdbdbd] bg-white
                  focus:outline-none focus:border-[#8b4513] focus:ring-2 focus:ring-[#8b4513]/20
                  transition-colors"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-[#5d4037] mb-1.5">Password</label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d6e63]"
                size={18}
              />
              <input
                type={hidePassword ? 'password' : 'text'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pl-10 pr-11 py-3 border border-[#d7ccc8] rounded-lg text-sm
                  text-[#3e2723] placeholder-[#bdbdbd] bg-white
                  focus:outline-none focus:border-[#8b4513] focus:ring-2 focus:ring-[#8b4513]/20
                  transition-colors"
              />
              <button
                type="button"
                onClick={() => setHidePassword(!hidePassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d6e63]
                  hover:text-[#5d4037] bg-transparent border-none cursor-pointer p-0"
              >
                {hidePassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="flex items-center gap-2 text-[#c62828] text-[13px] px-3 py-2 bg-[#ffebee] rounded-md">
              <AlertCircle size={18} className="shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full h-12 bg-[#8b4513] text-white text-base font-semibold rounded-lg
              mt-2 flex items-center justify-center cursor-pointer border-none
              hover:bg-[#7a3b10] transition-colors
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
