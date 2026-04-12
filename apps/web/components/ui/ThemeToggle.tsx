'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ThemePreference } from '../theme/ThemeProvider';
import { useTheme } from '../theme/ThemeProvider';

const MENU_ROOT = '[data-theme-menu-root]';

const OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: 'light_mode' },
  { value: 'dark', label: 'Dark', icon: 'dark_mode' },
  { value: 'system', label: 'Auto', icon: 'routine' },
];

export default function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = e.target as Element | null;
      if (el && !el.closest(MENU_ROOT)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const triggerIcon =
    preference === 'system' ? 'routine' : preference === 'light' ? 'light_mode' : 'dark_mode';

  const title =
    preference === 'system'
      ? 'Theme: Auto (system)'
      : preference === 'light'
        ? 'Theme: Light'
        : 'Theme: Dark';

  const pick = useCallback(
    (p: ThemePreference) => {
      setPreference(p);
      setOpen(false);
    },
    [setPreference],
  );

  return (
    <div className="relative" data-theme-menu-root>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-frost text-on-surface hover:bg-white/[0.05] transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${title}. Open theme menu`}
        title={title}
      >
        {!mounted ? (
          <span className="material-symbols-outlined text-lg opacity-0" aria-hidden>
            routine
          </span>
        ) : (
          <span className="material-symbols-outlined text-lg" aria-hidden>
            {triggerIcon}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-[70] mt-2 min-w-[180px] rounded-2xl border border-frost bg-surface/95 backdrop-blur-xl p-2 shadow-ambient"
          role="menu"
          aria-label="Theme"
        >
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="menuitemradio"
              aria-checked={preference === opt.value}
              onClick={() => pick(opt.value)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                preference === opt.value
                  ? 'bg-primary/15 text-primary'
                  : 'text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-base text-on-surface-variant" aria-hidden>
                {opt.icon}
              </span>
              {opt.label}
              {preference === opt.value && (
                <span className="material-symbols-outlined ml-auto text-base text-primary" aria-hidden>
                  check
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
