import { useCallback, useEffect, useState } from 'react';
import { getMobileAuthSession, type MobileAuthSession } from '../authSession';

export const useMobileAuth = () => {
  const [session, setSession] = useState<MobileAuthSession | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    const s = await getMobileAuthSession();
    setSession(s);
    return s;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    session,
    isLoading: session === undefined,
    isAuthenticated: Boolean(session?.accessToken),
    refresh,
  };
};

export const useAccessToken = () => {
  const { session, refresh } = useMobileAuth();
  return {
    accessToken: session?.accessToken ?? null,
    isLoading: session === undefined,
    refresh,
  };
};
