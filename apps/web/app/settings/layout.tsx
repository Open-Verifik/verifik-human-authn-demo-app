'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import HomeHeader from '../home/HomeHeader';
import { useAuthHydration } from '../hooks/useAuthHydration';
import DemoSignInPrompt from '../demos/DemoSignInPrompt';
import { useAuthStore } from '../store/authStore';

const NAV: { section: string; items: { href: string; label: string; icon: string }[] }[] = [
  {
    section: 'My account',
    items: [{ href: '/settings/profile', label: 'Profile', icon: 'person' }],
  },
  {
    section: 'Developers',
    items: [{ href: '/settings/api-key', label: 'API Key', icon: 'vpn_key' }],
  },
];

function SettingsSidebar({
  onNavigate,
  className = '',
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      className={`flex flex-col gap-6 border-r border-frost bg-surface-container-low/40 ${className}`}
      aria-label="Settings sections"
    >
      <div className="px-4 pt-6 pb-2 md:px-5">
        <div className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-xl" aria-hidden>
            settings
          </span>
          <span className="text-lg font-bold tracking-tight text-on-surface">Settings</span>
        </div>
      </div>
      {NAV.map(({ section, items }) => (
        <div key={section} className="px-2 md:px-3">
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/80">
            {section}
          </p>
          <ul className="mt-1 space-y-0.5">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary/15 text-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-lg ${active ? 'text-primary' : 'text-on-surface-variant'}`}
                      aria-hidden
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {active && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  useAuthHydration();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <HomeHeader />
      <div className="flex flex-1 flex-col pt-[4.5rem] md:pt-20">
        {!hasHydrated ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="h-10 w-48 rounded-xl bg-surface-container-high animate-pulse" aria-hidden />
          </div>
        ) : !isAuthenticated ? (
          <div className="mx-auto w-full max-w-md flex-1 flex items-center justify-center p-6">
            <DemoSignInPrompt className="w-full" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-frost bg-surface-container-low/30 px-4 py-3 md:hidden">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-frost text-on-surface hover:bg-surface-container-high"
                aria-expanded={mobileNavOpen}
                aria-label="Open settings menu"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <span className="font-semibold text-on-surface">Settings</span>
            </div>

            {mobileNavOpen && (
              <button
                type="button"
                className="fixed inset-0 z-40 bg-black/50 md:hidden"
                aria-label="Close menu"
                onClick={closeMobileNav}
              />
            )}

            <div className="flex flex-1 min-h-0">
              <SettingsSidebar
                className={`fixed bottom-0 left-0 top-[4.5rem] z-50 w-72 overflow-y-auto pb-safe pt-2 transition-transform md:static md:bottom-auto md:z-0 md:top-auto md:h-auto md:min-h-0 md:w-64 md:shrink-0 md:translate-x-0 md:pt-4 ${
                  mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                onNavigate={closeMobileNav}
              />
              <main className="flex-1 overflow-y-auto min-w-0">{children}</main>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
