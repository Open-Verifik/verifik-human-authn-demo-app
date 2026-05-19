import { Platform } from 'react-native';

/** OS string for Verifik biometric API payloads. */
export const getBiometricOs = (): 'IOS' | 'ANDROID' | 'DESKTOP' =>
  Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'DESKTOP';

export const unwrapApiData = (raw: unknown): Record<string, unknown> | null => {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const inner = root.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  return root;
};

export const formatJsonPreview = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};
