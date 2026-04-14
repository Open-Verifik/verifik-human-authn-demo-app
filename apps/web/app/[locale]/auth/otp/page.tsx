'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import {
  authSession,
  getProjectLoginAccessToken,
  getValidationLoginToken,
  projectLogin,
  validateEmailOTP,
  validatePhoneOTP,
  verifikConfig,
} from '@humanauthn/api-client';
import { readUserCreditsFromSessionUser, useAuthStore } from '../../../store/authStore';
import { AuroraBackground } from '@/components/ui/aurora-background';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { VerifikLogo } from '@/components/ui/VerifikLogo';

export default function OTPPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [destination, setDestination] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const m = (sessionStorage.getItem('auth_method') ?? 'email') as 'email' | 'phone';
    setDestination(sessionStorage.getItem('auth_destination') ?? '');
    setMethod(m);
    if (m === 'phone') {
      setPhoneCountryCode(sessionStorage.getItem('auth_country_code') ?? '+1');
    }
    inputRefs.current[0]?.focus();
  }, []);

  // ── Digit input handling ───────────────────────────────────
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') handleVerify();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  // ── Verify ─────────────────────────────────────────────────
  const handleVerify = async () => {
    const otp = digits.join('');
    if (otp.length < 6) { setError('Please enter the complete 6-digit code'); return; }
    setIsLoading(true);
    setError(null);

    const projectId     = verifikConfig.projectId;
    const projectFlowId = verifikConfig.loginProjectFlowId;

    const payload = {
      otp,
      project:          projectId,
      projectFlow:      projectFlowId,
      type:             'login' as const,
      validationMethod: 'verificationCode' as const,
      ...(method === 'email'
        ? { email: destination }
        : { phone: destination, countryCode: phoneCountryCode }),
    };

    const fn = method === 'email' ? validateEmailOTP : validatePhoneOTP;
    const res = await fn(payload);

    if (res.error) {
      setIsLoading(false);
      setError(res.error);
      return;
    }

    const validationToken = getValidationLoginToken(res.data);
    if (!validationToken) {
      setIsLoading(false);
      setError('Invalid login response. Please try again.');
      return;
    }

    const pl = await projectLogin(validationToken);
    if (pl.error) {
      setIsLoading(false);
      setError(pl.error);
      return;
    }

    const accessToken = getProjectLoginAccessToken(pl.data);
    if (!accessToken) {
      setIsLoading(false);
      setError('Could not complete sign-in. Please try again.');
      return;
    }

    const sess = await authSession(accessToken, { origin: 'app' });
    if (sess.error) {
      setIsLoading(false);
      setError(sess.error);
      return;
    }

    const user = sess.data?.user;
    const userId = user?._id != null ? String(user._id) : null;
    const finalToken = sess.data?.accessToken ?? accessToken;

    useAuthStore.getState().setAuthenticated(finalToken, userId, {
      email: typeof user?.email === 'string' ? user.email : undefined,
      name: typeof user?.name === 'string' ? user.name : undefined,
      credits: readUserCreditsFromSessionUser(user),
    });

    setIsLoading(false);
    sessionStorage.removeItem('auth_method');
    sessionStorage.removeItem('auth_destination');
    sessionStorage.removeItem('auth_country_code');
    router.push('/home');
  };

  const codeComplete = digits.every(Boolean);

  // ── Render ─────────────────────────────────────────────────
  return (
    <AuroraBackground className="px-4 overflow-hidden">

      {/* Main Modal Card */}
      <main className="relative z-10 w-full max-w-[400px] bg-white rounded-3xl p-8 shadow-float animate-slide-up text-auth-modal-ink">
        
        {/* Header Strip */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-transparent hover:bg-black/5 hover:border-black/10 text-auth-modal-ink/55 hover:text-auth-modal-ink transition-all"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>

          <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2 text-auth-modal-ink">
            <VerifikLogo className="h-6 w-auto" />
          </div>
          
          <ThemeToggle />
        </div>

        {/* Headline */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-auth-modal-ink mb-2">
            Enter Code
          </h1>
          <p className="text-sm text-auth-modal-ink/70 leading-relaxed max-w-[280px] mx-auto">
            We sent a 6-digit code to{' '}
            <span className="text-primary font-medium">{destination || 'your account'}</span>.
          </p>
        </div>

        {/* OTP Inputs */}
        <div
          className="flex justify-between gap-2 mb-8"
          onPaste={handlePaste}
        >
          {digits.map((digit, i) => (
            <input
              key={i}
              id={`otp-digit-${i}`}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              placeholder="0"
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`
                w-full aspect-square text-center text-2xl font-bold rounded-xl outline-none transition-all duration-200
                ${digit 
                  ? 'bg-primary/5 text-primary border border-primary/50' 
                  : 'bg-transparent text-auth-modal-ink border border-black/10 placeholder-auth-modal-ink/35'
                }
                focus:ring-1 focus:ring-primary/50 focus:border-primary
              `}
            />
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 px-3 py-2.5 bg-error/10 border border-error/20 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[18px]">error</span>
            <span className="text-xs text-error">{error}</span>
          </div>
        )}

        {/* Verify CTA */}
        <button
          id="btn-verify-otp"
          onClick={handleVerify}
          disabled={!codeComplete || isLoading}
          className="w-full py-3.5 bg-primary-cta text-on-primary-container font-semibold rounded-xl shadow-primary
                     hover:opacity-90 active:scale-[0.98] transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
          ) : (
            'Verify Code'
          )}
        </button>

        {/* Resend */}
        <p className="text-center mt-6 text-sm text-auth-modal-ink/70">
          Didn&apos;t receive the code?{' '}
          <button
            onClick={() => router.back()}
            className="text-primary hover:underline underline-offset-4 ml-1 font-medium transition-all"
          >
            Resend
          </button>
        </p>

        {/* Minimal Security Footer */}
        <div className="mt-8 flex items-center justify-center gap-4 opacity-60 text-[9px] font-mono text-auth-modal-ink/55 uppercase tracking-widest">
          <span>AES-256</span>
          <span>•</span>
          <span>Verifik</span>
        </div>
      </main>
    </AuroraBackground>
  );
}
