import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import {
  enMessages,
  loadMessagesForLocale,
  resolveDeviceLocale,
  DEFAULT_LOCALE,
  type AppLocale,
} from '@humanauthn/i18n-messages';
import { getStoredLocale, setStoredLocale } from './localeStorage';

let initPromise: Promise<void> | null = null;

const withTimeout = async <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const englishBundle = enMessages as Record<string, unknown>;

const addLocaleBundle = async (locale: string): Promise<void> => {
  if (locale === DEFAULT_LOCALE || i18n.hasResourceBundle(locale, 'translation')) return;
  const messages = await loadMessagesForLocale(locale);
  i18n.addResourceBundle(locale, 'translation', messages, true, true);
};

export const initI18n = async (): Promise<void> => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const stored = await withTimeout(getStoredLocale(), 3000, null);
    const device = resolveDeviceLocale(Localization.getLocales()[0]?.languageCode);
    const locale = stored ?? device ?? DEFAULT_LOCALE;

    const resources: Record<string, { translation: Record<string, unknown> }> = {
      [DEFAULT_LOCALE]: { translation: englishBundle },
    };

    if (locale !== DEFAULT_LOCALE) {
      const messages = await withTimeout(
        loadMessagesForLocale(locale),
        5000,
        englishBundle,
      );
      resources[locale] = {
        translation: messages as Record<string, unknown>,
      };
    }

    await i18n.use(initReactI18next).init({
      lng: locale,
      fallbackLng: DEFAULT_LOCALE,
      resources,
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v3',
      react: { useSuspense: false },
    });
  })();

  return initPromise;
};

export const changeAppLocale = async (locale: AppLocale): Promise<void> => {
  await setStoredLocale(locale);
  await addLocaleBundle(locale);
  await i18n.changeLanguage(locale);
};

export default i18n;
