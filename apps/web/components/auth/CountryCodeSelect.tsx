'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  DEFAULT_PHONE_COUNTRY_ISO2,
  filterPhoneCountries,
  getPhoneCountryByIso2,
  type PhoneCountry,
} from '../../lib/phoneCountries';

type CountryCodeSelectProps = {
  valueIso2: string;
  onChange: (country: PhoneCountry) => void;
  disabled?: boolean;
};

export function CountryCodeSelect({ valueIso2, onChange, disabled }: CountryCodeSelectProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => getPhoneCountryByIso2(valueIso2) ?? getPhoneCountryByIso2(DEFAULT_PHONE_COUNTRY_ISO2)!,
    [valueIso2],
  );

  const filtered = useMemo(() => filterPhoneCountries(search), [search]);

  const close = useCallback(() => {
    setOpen(false);
    setSearch('');
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  const pick = (c: PhoneCountry) => {
    onChange(c);
    close();
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={clsx(
          'flex h-[50px] min-w-[108px] max-w-[132px] items-center gap-1.5 rounded-xl border border-black/10 bg-transparent px-2.5 text-left text-sm text-surface outline-none transition-all',
          'hover:bg-black/[0.02] focus:border-primary focus:ring-1 focus:ring-primary/50',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span className="text-base leading-none" aria-hidden>
          {selected.flag}
        </span>
        <span className="truncate font-medium tabular-nums">{selected.dialCode}</span>
        <span className="material-symbols-outlined ml-auto text-[18px] text-outline">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-50 flex max-h-[min(320px,calc(100vh-180px))] w-[min(100vw-2rem,320px)] flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg"
          role="presentation"
        >
          <div className="shrink-0 border-b border-black/10 p-2">
            <label htmlFor={`${listId}-search`} className="sr-only">
              Search country or dial code
            </label>
            <div className="relative">
              <span
                className="material-symbols-outlined pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline"
                aria-hidden
              >
                search
              </span>
              <input
                ref={searchRef}
                id={`${listId}-search`}
                type="search"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Country or +code"
                className="w-full rounded-lg border border-black/10 bg-black/[0.02] py-2 pl-9 pr-3 text-sm text-surface outline-none placeholder:text-outline/50 focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-label="Country calling code"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-outline">No matches</li>
            ) : (
              filtered.map((c) => (
                <li key={c.iso2} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.iso2 === selected.iso2}
                    onClick={() => pick(c)}
                    className={clsx(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                      c.iso2 === selected.iso2
                        ? 'bg-primary/10 text-surface'
                        : 'text-surface hover:bg-black/5',
                    )}
                  >
                    <span className="text-base" aria-hidden>
                      {c.flag}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    <span className="shrink-0 tabular-nums text-outline">{c.dialCode}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
