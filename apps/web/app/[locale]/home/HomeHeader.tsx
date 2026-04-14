'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useCallback, useEffect, useState } from 'react';
import { authSession } from '@humanauthn/api-client';
import { VerifikLogo } from '../../../components/ui/VerifikLogo';
import ThemeToggle from '../../../components/ui/ThemeToggle';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { useAuthHydration } from '../../hooks/useAuthHydration';
import { ELECTRON_TITLEBAR_DRAG_REGION_CLASS, useElectronTitleBarChrome } from '../../hooks/useElectronTitleBarChrome';
import { readUserCreditsFromSessionUser, useAuthStore } from '../../store/authStore';

const ACCOUNT_MENU_ROOT = '[data-account-menu-root]';

function initials(name: string | null, email: string | null): string {
  const s = (name || email || '?').trim();
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return s.slice(0, 2).toUpperCase();
}

export default function HomeHeader() {
  const t = useTranslations('HomeHeader');
  useAuthHydration();
  const router = useRouter();
  const [accountOpen, setAccountOpen] = useState(false);
  const { isElectron, isElectronMac, titleBarPaddingLeftPx } = useElectronTitleBarChrome();

  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userName = useAuthStore((s) => s.userName);
  const userEmail = useAuthStore((s) => s.userEmail);
  const credits = useAuthStore((s) => s.credits);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  const displayName = userName || userEmail || t('accountFallback');

  const handleSignOut = useCallback(() => {
    logout();
    setAccountOpen(false);
    router.push('/auth');
  }, [logout, router]);

  useEffect(() => {
    if (!accountOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = e.target as Element | null;
      if (el && !el.closest(ACCOUNT_MENU_ROOT)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [accountOpen]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    let cancelled = false;
    (async () => {
      const sess = await authSession(token, { origin: 'app' });
      if (cancelled || sess.error) return;
      const next = readUserCreditsFromSessionUser(sess.data?.user);
      if (next != null) useAuthStore.getState().setCredits(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token]);

  const AuthSkeleton = () => (
    <div className="h-9 w-24 rounded-lg bg-surface-container-high animate-pulse" aria-hidden />
  );

  const SignInLink = ({ className = '' }: { className?: string }) => (
    <Link
      href="/auth"
      className={`border border-frost text-primary px-5 py-2 rounded-full text-sm font-medium hover:bg-white/[0.05] active:scale-95 transition-all duration-200 inline-flex items-center justify-center ${className}`}
    >
      {t('signIn')}
    </Link>
  );

  const AccountMenu = () => (
    <div className="relative" data-account-menu-root>
      <button
        type="button"
        onClick={() => setAccountOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-frost hover:bg-white/[0.05] transition-colors px-3 py-1.5"
        aria-expanded={accountOpen}
        aria-haspopup="menu"
        aria-label={t('accountMenuAria')}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-on-primary-container text-xs font-bold">
          {initials(userName, userEmail)}
        </span>
        <span className="hidden sm:inline max-w-[140px] truncate text-left text-sm font-medium text-on-surface">
          {displayName}
        </span>
        <span className="material-symbols-outlined text-on-surface-variant text-lg">expand_more</span>
      </button>

      {accountOpen && (
        <div
          className="absolute right-0 top-full z-[60] mt-2 min-w-[240px] rounded-2xl border border-frost bg-surface/95 backdrop-blur-xl p-3 shadow-ambient"
          role="menu"
        >
          <p className="truncate text-sm font-semibold text-on-surface">{displayName}</p>
          {userEmail && (
            <p className="mt-0.5 truncate text-xs text-on-surface-variant">{userEmail}</p>
          )}
          {credits != null && (
            <p className="mt-2 text-xs text-on-surface-variant">
              <span className="text-on-surface/90">{t('credits')}</span>{' '}
              <span className="font-semibold tabular-nums text-primary">{credits.toLocaleString()}</span>
            </p>
          )}
          <div className="my-3 h-px bg-outline-variant/20" />
          <Link
            href="/settings/profile"
            role="menuitem"
            onClick={() => setAccountOpen(false)}
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-base text-on-surface-variant" aria-hidden>
              settings
            </span>
            {t('settings')}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-error hover:bg-error-container/10 transition-colors"
          >
            {t('signOut')}
          </button>
        </div>
      )}
    </div>
  );

  const authSlot = () => {
    if (!hasHydrated) return <AuthSkeleton />;
    if (!isAuthenticated) return <SignInLink />;
    return <AccountMenu />;
  };

  return (
    <header
      className={`fixed top-0 z-50 w-full bg-surface/90 backdrop-blur-xl border-b border-frost flex items-center justify-between py-4 pr-6 ${
        isElectronMac ? '' : 'pl-6'
      } ${isElectron ? ELECTRON_TITLEBAR_DRAG_REGION_CLASS : ''}`.trim()}
      style={titleBarPaddingLeftPx != null ? { paddingLeft: titleBarPaddingLeftPx } : undefined}
    >
      <Link
        href="/home"
        className="flex items-center text-on-surface hover:opacity-90 transition-opacity"
        aria-label={t('homeAria')}
      >
        <VerifikLogo className="h-7 w-auto sm:h-8" />
      </Link>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        {authSlot()}
      </div>
    </header>
  );
}
