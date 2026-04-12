'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthMethod = 'email' | 'phone';

export interface AuthState {
  // User identity
  isAuthenticated: boolean;
  token: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  /** Account credits from session user (refreshed on login and in HomeHeader). */
  credits: number | null;

  /** Client-only: true after zustand persist has finished rehydrating from storage */
  hasHydrated: boolean;

  // Project config: set from env or user entry
  projectId: string;
  projectFlowId: string;

  // Pending auth session
  pendingMethod: AuthMethod | null;
  pendingDestination: string | null; // email or phone number

  // Actions
  setProject:          (id: string, flowId: string) => void;
  setPendingAuth:      (method: AuthMethod, destination: string) => void;
  setAuthenticated:    (
    token: string,
    userId?: string | null,
    profile?: { email?: string; name?: string; credits?: number | null } | null
  ) => void;
  setCredits:          (credits: number | null) => void;
  /** Replace JWT after renew / revoke (keeps userId and profile fields as-is). */
  setAccessToken:      (token: string) => void;
  /** After profile PUT, sync header display fields. */
  setUserDisplay:      (profile: Partial<Pick<AuthState, 'userName' | 'userEmail' | 'credits'>>) => void;
  clearPendingAuth:    () => void;
  logout:              () => void;
  setHasHydrated:      (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get, store) => ({
      // ── Initial State ────────────────────────────────────────
      isAuthenticated:    false,
      token:              null,
      userId:             null,
      userEmail:          null,
      userName:           null,
      credits:            null,
      hasHydrated:        false,
      projectId:          process.env.NEXT_PUBLIC_VERIFIK_PROJECT_ID ?? '',
      projectFlowId:      process.env.NEXT_PUBLIC_VERIFIK_PROJECT_FLOW_ID ?? '',
      pendingMethod:      null,
      pendingDestination: null,

      // ── Actions ──────────────────────────────────────────────
      setProject: (id, flowId) =>
        set({ projectId: id, projectFlowId: flowId }),

      setPendingAuth: (method, destination) =>
        set({ pendingMethod: method, pendingDestination: destination }),

      setAuthenticated: (token, userId, profile) =>
        set({
          isAuthenticated: true,
          token,
          userId: userId ?? null,
          userEmail: profile?.email ?? null,
          userName: profile?.name ?? null,
          credits: profile?.credits ?? null,
        }),

      setCredits: (credits) => set({ credits }),

      setAccessToken: (token) => set({ token, isAuthenticated: true }),

      setUserDisplay: (profile) => set(profile),

      clearPendingAuth: () =>
        set({ pendingMethod: null, pendingDestination: null }),

      logout: () => {
        const { projectId, projectFlowId } = get();
        set({
          isAuthenticated: false,
          token: null,
          userId: null,
          userEmail: null,
          userName: null,
          credits: null,
          pendingMethod: null,
          pendingDestination: null,
        });
        if (typeof window !== 'undefined') {
          try {
            window.sessionStorage.removeItem('auth_method');
            window.sessionStorage.removeItem('auth_destination');
          } catch {
            /* ignore quota / privacy mode */
          }
          store.persist.clearStorage();
          set({ projectId, projectFlowId });
        }
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'humanauthn-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token:           state.token,
        userId:          state.userId,
        userEmail:       state.userEmail,
        userName:        state.userName,
        credits:         state.credits,
        projectId:       state.projectId,
        projectFlowId:   state.projectFlowId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/** Normalize `user.credits` from auth session (number or numeric string). */
export function readUserCreditsFromSessionUser(user: unknown): number | null {
  if (!user || typeof user !== 'object') return null;
  const c = (user as Record<string, unknown>).credits;
  if (typeof c === 'number' && !Number.isNaN(c)) return c;
  if (typeof c === 'string' && c.trim() !== '') {
    const n = Number(c);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}
