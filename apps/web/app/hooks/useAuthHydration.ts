'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

/** Subscribes to zustand persist hydration so `hasHydrated` is accurate (match HomeHeader / demos). */
export function useAuthHydration() {
  useEffect(() => {
    const api = useAuthStore.persist;
    if (api.hasHydrated()) {
      useAuthStore.getState().setHasHydrated(true);
      return;
    }
    const unsub = api.onFinishHydration(() => {
      useAuthStore.getState().setHasHydrated(true);
    });
    return unsub;
  }, []);
}
