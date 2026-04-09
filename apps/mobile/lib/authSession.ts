import AsyncStorage from '@react-native-async-storage/async-storage';

/** Same storage key as OTP success; holds final session JWT + profile (matches web `token` + user fields). */
export const AUTH_SESSION_STORAGE_KEY = 'humanauthn-session';

export type MobileAuthSession = {
  accessToken: string;
  userId: string | null;
  email?: string;
  name?: string;
};

export async function getMobileAuthSession(): Promise<MobileAuthSession | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MobileAuthSession>;
    if (typeof parsed.accessToken !== 'string' || !parsed.accessToken) {
      await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      return null;
    }
    return {
      accessToken: parsed.accessToken,
      userId: parsed.userId != null ? String(parsed.userId) : null,
      email: typeof parsed.email === 'string' ? parsed.email : undefined,
      name: typeof parsed.name === 'string' ? parsed.name : undefined,
    };
  } catch {
    try {
      await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export async function persistMobileAuthSession(payload: {
  accessToken: string;
  userId: string | null;
  email?: string;
  name?: string;
}): Promise<void> {
  await AsyncStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify({
      accessToken: payload.accessToken,
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
    })
  );
}

/** Removes session / access JWT and account data from device storage (parity with web `logout`). */
export async function signOutMobile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  if (__DEV__) {
    console.log('[HumanAuthn auth][mobile] signOut: AsyncStorage session removed');
  }
}
