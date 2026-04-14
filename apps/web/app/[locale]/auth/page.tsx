'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendEmailOTP, sendPhoneOTP, verifikConfig } from '@humanauthn/api-client';
import { CountryCodeSelect } from '../../../components/auth/CountryCodeSelect';
import { AuroraBackground } from '../../../components/ui/aurora-background';
import ThemeToggle from '../../../components/ui/ThemeToggle';
import { VerifikLogo } from '../../../components/ui/VerifikLogo';
import { DEFAULT_PHONE_COUNTRY_ISO2, getPhoneCountryByIso2 } from '../../../lib/phoneCountries';

// ─── Validation Schemas ───────────────────────────────────────────────────────
const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

const phoneSchema = z.object({
  phone: z.string().min(7, 'Enter a valid phone number'),
});

type EmailForm = z.infer<typeof emailSchema>;
type PhoneForm = z.infer<typeof phoneSchema>;

// ─── Component ────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const router = useRouter();
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [phoneCountryIso2, setPhoneCountryIso2] = useState(DEFAULT_PHONE_COUNTRY_ISO2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    mode: 'onChange',
    defaultValues: { email: '' },
  });
  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    mode: 'onChange',
    defaultValues: { phone: '' },
  });

  const emailValue = emailForm.watch('email');
  const phoneValue = phoneForm.watch('phone');
  const canSendEmail = emailSchema.safeParse({ email: emailValue }).success;
  const canSendPhone = phoneSchema.safeParse({ phone: phoneValue }).success;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const onEmailSubmit = async (data: EmailForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await sendEmailOTP({
        email: data.email,
        project:        verifikConfig.projectId,
        projectFlow:    verifikConfig.loginProjectFlowId,
        type:           'login',
        validationMethod: 'verificationCode',
        language:       'en',
      });
      if (res.error) { setError(res.error); return; }
      sessionStorage.setItem('auth_method', 'email');
      sessionStorage.setItem('auth_destination', data.email);
      sessionStorage.removeItem('auth_country_code');
      router.push('/auth/otp');
    } finally {
      setIsLoading(false);
    }
  };

  const onPhoneSubmit = async (data: PhoneForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const country = getPhoneCountryByIso2(phoneCountryIso2);
      const countryCode = country?.dialCode ?? '+1';
      const res = await sendPhoneOTP({
        phone:          data.phone,
        countryCode,
        project:        verifikConfig.projectId,
        projectFlow:    verifikConfig.loginProjectFlowId,
        type:           'login',
        validationMethod: 'verificationCode',
        language:       'en',
      });
      if (res.error) { setError(res.error); return; }
      sessionStorage.setItem('auth_method', 'phone');
      sessionStorage.setItem('auth_destination', data.phone);
      sessionStorage.setItem('auth_country_code', countryCode);
      router.push('/auth/otp');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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

        {/* Headlines */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-auth-modal-ink mb-2">
            Sign in
          </h1>
          <p className="text-sm text-auth-modal-ink/70">
            Enter your email or phone to receive a code.
          </p>
        </div>

        {/* Method Toggle */}
        <div className="flex bg-black/5 p-1 rounded-xl mb-6 border border-black/5">
          <button
            id="tab-email"
            onClick={() => { setMethod('email'); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              method === 'email'
                ? 'bg-white text-primary shadow-sm border border-black/5'
                : 'text-auth-modal-ink/60 hover:text-auth-modal-ink border border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">email</span>
            Email
          </button>
          <button
            id="tab-phone"
            onClick={() => { setMethod('phone'); setError(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              method === 'phone'
                ? 'bg-white text-primary shadow-sm border border-black/5'
                : 'text-auth-modal-ink/60 hover:text-auth-modal-ink border border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">phone</span>
            Phone
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 px-3 py-2.5 bg-error/10 border border-error/20 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[18px]">error</span>
            <span className="text-xs text-error">{error}</span>
          </div>
        )}

        {/* Email Form */}
        {method === 'email' && (
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email-input" className="sr-only">Email Address</label>
              <input
                id="email-input"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full bg-transparent text-auth-modal-ink px-4 py-3.5 rounded-xl
                           placeholder-auth-modal-ink/45 border border-black/10 outline-none
                           focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                {...emailForm.register('email')}
              />
              {emailForm.formState.errors.email && (
                <p className="mt-1.5 text-xs text-error pl-1">{emailForm.formState.errors.email.message}</p>
              )}
            </div>
            <button
              id="btn-send-email-code"
              type="submit"
              disabled={isLoading || !canSendEmail}
              className="w-full py-3.5 bg-primary-cta text-on-primary-container font-semibold rounded-xl shadow-primary
                         enabled:hover:opacity-90 active:scale-[0.98] transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
              ) : (
                'Send Code'
              )}
            </button>
          </form>
        )}

        {/* Phone Form */}
        {method === 'phone' && (
          <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
            <div>
              <span className="sr-only">Country and phone number</span>
              <div className="flex gap-2">
                <CountryCodeSelect
                  valueIso2={phoneCountryIso2}
                  onChange={(c) => setPhoneCountryIso2(c.iso2)}
                  disabled={isLoading}
                />
                <div className="min-w-0 flex-1">
                  <label htmlFor="phone-input" className="sr-only">Phone Number</label>
                  <input
                    id="phone-input"
                    type="tel"
                    autoComplete="tel-national"
                    placeholder="Phone number"
                    className="w-full min-w-0 bg-transparent text-auth-modal-ink px-4 py-3.5 rounded-xl
                               placeholder-auth-modal-ink/45 border border-black/10 outline-none
                               focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                    {...phoneForm.register('phone')}
                  />
                </div>
              </div>
              {phoneForm.formState.errors.phone && (
                <p className="mt-1.5 text-xs text-error pl-1">{phoneForm.formState.errors.phone.message}</p>
              )}
            </div>
            <button
              id="btn-send-phone-code"
              type="submit"
              disabled={isLoading || !canSendPhone}
              className="w-full py-3.5 bg-primary-cta text-on-primary-container font-semibold rounded-xl shadow-primary
                         enabled:hover:opacity-90 active:scale-[0.98] transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
              ) : (
                'Send Code'
              )}
            </button>
          </form>
        )}

        {/* Hairline Divider */}
        <div className="relative flex items-center justify-center py-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/10" />
          </div>
          <div className="relative bg-white px-3 rounded-full text-[10px] font-bold text-auth-modal-ink/55 uppercase tracking-wider">
            Or
          </div>
        </div>

        {/* Biometric alternative */}
        <button
          id="btn-biometric-login"
          onClick={() => router.push('/demos/humanid')}
          className="w-full py-3.5 border border-black/10 bg-transparent hover:bg-black/5 text-auth-modal-ink font-semibold text-sm
                     rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">face</span>
          Continue with HumanID
        </button>

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
