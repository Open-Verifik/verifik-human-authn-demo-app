import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SplashPage' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function SplashPage() {
  const t = await getTranslations('SplashPage');

  return (
    <main className="relative flex flex-col items-center justify-start min-h-screen overflow-hidden bg-surface">
      <div
        className="auth-pulse absolute w-[600px] h-[600px] top-[-15%] left-1/2 -translate-x-1/2 z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl px-6 pt-12 md:pt-16 flex flex-col items-center">
        <div className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-2xl overflow-hidden mask-gradient-bottom">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfmJQC0Xpka4crIYxjI6Dta1wZKYOC3NetOpAIWsnR8CI07aOICUI0zrYPJAvYCJ1hYMPHUV7IY5QO1n0HLJRLjum3d9MqvhVobgtRE7eK6MLw6IA5H2aLpDPxaaFl_PTd3zwMfhfnNB6I2FRnze3T7cMcSb2dw2H6NBVBtPKHGMPSV2Z_Vw_9lGYouvrK7u54dT6j936Hz--LNGujRL4hII3NQeS0Zx9MpEIirboEOU2ZsIAV7qGhKxwfj-WR6Nmr90aU9mtx0c8"
            alt={t('heroImageAlt')}
            className="w-full h-full object-cover opacity-80 grayscale scale-110"
          />

          <div className="absolute inset-0 z-20 flex flex-col justify-center items-center pointer-events-none">
            <div className="scan-line" aria-hidden="true" />
            <div className="scanner-corner-tl opacity-60" />
            <div className="scanner-corner-tr opacity-60" />
            <div className="scanner-corner-bl opacity-30" />
            <div className="scanner-corner-br opacity-30" />
            <div className="glass-panel flex items-center gap-3 px-5 py-2.5 rounded-full ghost-border shadow-float">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="label-meta text-white text-[0.625rem]">{t('readinessBadge')}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center text-center px-4 -mt-8 md:-mt-16 pb-24 space-y-10 max-w-xl w-full">
          <div className="space-y-4">
            <span className="inline-block px-4 py-1.5 bg-surface-container-high text-primary label-meta text-[0.625rem] rounded-full ghost-border">
              {t('brandPill')}
            </span>
            <h1 className="text-6xl md:text-8xl font-headline font-black tracking-editorial text-on-surface leading-[0.95]">
              {t('headlineLine1')}
              <br />
              {t('headlineLine2')}
            </h1>
            <p className="text-on-surface-variant text-lg md:text-xl font-medium leading-relaxed max-w-sm mx-auto pt-4">
              {t('tagline')}
            </p>
          </div>

          <div className="w-full space-y-4">
            <Link
              href="/auth"
              id="btn-get-started"
              className="block w-full py-5 bg-white text-black font-black text-sm uppercase tracking-widest rounded-full shadow-float hover:bg-primary-fixed hover:shadow-primary transition-all duration-300 active:scale-[0.97] text-center"
            >
              {t('ctaPrimary')}
            </Link>
            <Link
              href="/home"
              id="btn-explore-demos"
              className="block w-full py-4 text-[0.65rem] font-label text-on-surface-variant tracking-[0.25em] uppercase text-center hover:text-primary transition-colors"
            >
              {t('ctaSecondary')}
            </Link>
          </div>

          <div
            className="pt-4 flex items-center justify-center gap-6 text-on-surface-variant/55"
            aria-label={t('trustAria')}
          >
            <span className="material-symbols-outlined text-2xl" aria-hidden>
              security
            </span>
            <span className="material-symbols-outlined text-2xl" aria-hidden>
              fingerprint
            </span>
            <span className="material-symbols-outlined text-2xl" aria-hidden>
              face
            </span>
            <span className="material-symbols-outlined text-2xl" aria-hidden>
              verified_user
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
