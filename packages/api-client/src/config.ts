/**
 * API host for all /v2 routes (auth, liveness, face-comparison, etc.).
 * Override per app: Next.js `NEXT_PUBLIC_VERIFIK_API_URL`, Expo `EXPO_PUBLIC_VERIFIK_API_URL`.
 */
function resolveApiUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_VERIFIK_API_URL?.trim() ||
    process.env.EXPO_PUBLIC_VERIFIK_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const isDev = process.env.NODE_ENV !== 'production';
  return isDev ? 'https://verifik.app' : 'https://api.verifik.co';
}

const isDev = process.env.NODE_ENV !== 'production';

export const verifikConfig = {
  apiUrl: resolveApiUrl(),
  projectId: isDev ? '6266193db77ccc8111730c90' : '6332941ccde4f719d9c00f9e',
  loginProjectFlowId: isDev ? '658ed28b0990f300134d7b78' : '6332941ccde4f719d9c00f9f',
};
