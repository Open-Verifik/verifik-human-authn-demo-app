import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppLocale } from '@humanauthn/demo-catalog';

const LOCALE_KEY = 'humanauthn-locale';

export const getStoredLocale = async (): Promise<AppLocale | null> => {
  try {
    const raw = await AsyncStorage.getItem(LOCALE_KEY);
    if (!raw) return null;
    return raw as AppLocale;
  } catch {
    return null;
  }
};

export const setStoredLocale = async (locale: AppLocale): Promise<void> => {
  await AsyncStorage.setItem(LOCALE_KEY, locale);
};
