'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type AppLocale } from '@/i18n/routing';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const t = useTranslations('LanguageSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <span className="sr-only">{t('ariaLabel')}</span>
      <span className="material-symbols-outlined text-on-surface-variant text-lg" aria-hidden>
        translate
      </span>
      <select
        aria-label={t('ariaLabel')}
        value={locale}
        onChange={(e) => {
          const next = e.target.value;
          router.replace(pathname, { locale: next });
        }}
        className="rounded-lg border border-frost bg-surface-container-high/50 px-2 py-1.5 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {routing.locales.map((loc: string) => (
          <option key={loc} value={loc}>
            {t(loc as AppLocale)}
          </option>
        ))}
      </select>
    </label>
  );
}
