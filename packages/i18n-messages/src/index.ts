import enMessages from './locales/en';
import { APP_LOCALES, type AppLocale } from '@humanauthn/demo-catalog';

export { APP_LOCALES, type AppLocale };
export { enMessages };

export const DEFAULT_LOCALE: AppLocale = 'en';

type LocaleModule = { default: Record<string, unknown> };

const localeLoaders: Record<string, () => Promise<LocaleModule>> = {
  en: () => import('./locales/en'),
  es: () => import('./locales/es'),
  pt: () => import('./locales/pt'),
  fr: () => import('./locales/fr'),
  hi: () => import('./locales/hi'),
  zh: () => import('./locales/zh'),
  ko: () => import('./locales/ko'),
  ja: () => import('./locales/ja'),
  de: () => import('./locales/de'),
  id: () => import('./locales/id'),
  vi: () => import('./locales/vi'),
  tr: () => import('./locales/tr'),
  ar: () => import('./locales/ar'),
};

/** Load one locale bundle on demand (avoids bundling all 13 at startup). */
export const loadMessagesForLocale = async (locale: string): Promise<Record<string, unknown>> => {
  const loader = localeLoaders[locale] ?? localeLoaders.en;
  const mod = await loader();
  return mod.default;
};

export const resolveDeviceLocale = (deviceTag: string | null | undefined): AppLocale => {
  if (!deviceTag) return DEFAULT_LOCALE;
  const base = deviceTag.split('-')[0]?.toLowerCase();
  if (base && (APP_LOCALES as readonly string[]).includes(base)) {
    return base as AppLocale;
  }
  return DEFAULT_LOCALE;
};
