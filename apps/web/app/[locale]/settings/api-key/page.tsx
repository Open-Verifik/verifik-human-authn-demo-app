'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  authSessionRefresh,
  getAccessTokenFromSessionBody,
  getTokenFromRenewAndRevoke,
  renewAndRevokeToken,
} from '@humanauthn/api-client';
import { useAuthStore } from '../../../store/authStore';

const EXPIRATION_MONTHS = [1, 2, 3, 6, 12, 24, 36] as const;

function maskToken(token: string): string {
  if (!token) return '';
  const visibleChars = 12;
  if (token.length <= visibleChars * 2) return '•'.repeat(token.length);
  const start = token.slice(0, visibleChars);
  const end = token.slice(-visibleChars);
  const middleLength = token.length - visibleChars * 2;
  return `${start}${'•'.repeat(Math.min(middleLength, 20))}${end}`;
}

export default function SettingsApiKeyPage() {
  const translateApiKey = useTranslations('settingsApiKey');
  const token = useAuthStore((s) => s.token);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  const [hideToken, setHideToken] = useState(true);
  const [showNewTokenAlert, setShowNewTokenAlert] = useState(false);
  const [newlyShownToken, setNewlyShownToken] = useState<string | null>(null);
  const [showRenewPanel, setShowRenewPanel] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<number>(1);
  const [renewing, setRenewing] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyOk, setCopyOk] = useState(false);

  const displayToken = newlyShownToken ?? token ?? '';

  const copyToken = async () => {
    const toCopy = newlyShownToken ?? token;
    if (!toCopy) return;
    try {
      await navigator.clipboard.writeText(toCopy);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 2000);
    } catch {
      setError(translateApiKey('errorCopyFailed'));
    }
  };

  const dismissAlert = () => {
    setShowNewTokenAlert(false);
    setNewlyShownToken(null);
  };

  const openRenew = () => {
    setShowRenewPanel(true);
    setShowRevokeConfirm(false);
    setError(null);
  };

  const openRevoke = () => {
    setShowRevokeConfirm(true);
    setShowRenewPanel(false);
    setError(null);
  };

  const renew = async () => {
    if (!token) return;
    setRenewing(true);
    setError(null);
    const res = await authSessionRefresh(token, selectedMonths);
    setRenewing(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    const raw = res.data as Record<string, unknown> | undefined;
    const next = raw ? getAccessTokenFromSessionBody(raw) : null;
    if (!next) {
      setError(translateApiKey('errorNoToken'));
      return;
    }
    setAccessToken(next);
    setNewlyShownToken(next);
    setShowNewTokenAlert(true);
    setShowRenewPanel(false);
    setHideToken(false);
  };

  const revoke = async () => {
    if (!token) return;
    setRevoking(true);
    setError(null);
    const res = await renewAndRevokeToken(token);
    setRevoking(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    const next = getTokenFromRenewAndRevoke(res.data);
    if (!next) {
      setError(translateApiKey('errorNoToken'));
      return;
    }
    setAccessToken(next);
    setNewlyShownToken(next);
    setShowNewTokenAlert(true);
    setShowRevokeConfirm(false);
    setHideToken(false);
  };

  if (!token) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <p className="text-on-surface-variant text-sm">{translateApiKey('signInPrompt')}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-10 pb-safe">
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
          <span className="material-symbols-outlined text-2xl">vpn_key</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{translateApiKey('pageTitle')}</h1>
          <p className="text-on-surface-variant text-sm mt-1">{translateApiKey('pageSubtitle')}</p>
        </div>
      </div>

      {showNewTokenAlert && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/10 p-4 flex gap-3 items-start">
          <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-on-surface">{translateApiKey('newTokenTitle')}</p>
            <p className="text-sm text-on-surface-variant mt-1">{translateApiKey('newTokenBody')}</p>
          </div>
          <button
            type="button"
            onClick={dismissAlert}
            className="text-on-surface-variant hover:text-on-surface p-1"
            aria-label={translateApiKey('dismissAria')}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-frost bg-surface-container-low/40 overflow-hidden mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">vpn_key</span>
            <div>
              <h2 className="font-semibold text-on-surface">{translateApiKey('currentTokenTitle')}</h2>
              <p className="text-xs text-on-surface-variant">{translateApiKey('currentTokenHint')}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            {translateApiKey('active')}
          </span>
        </div>
        <div className="p-5">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center rounded-xl bg-surface-container-high/50 border border-frost p-3">
            <button
              type="button"
              onClick={copyToken}
              className="flex-1 text-left font-mono text-sm text-on-surface break-all cursor-pointer hover:opacity-90"
              title={translateApiKey('copyTitle')}
            >
              {hideToken ? maskToken(displayToken) : displayToken}
            </button>
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setHideToken((h) => !h)}
                className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant"
                aria-label={hideToken ? translateApiKey('showTokenAria') : translateApiKey('hideTokenAria')}
              >
                <span className="material-symbols-outlined text-xl">
                  {hideToken ? 'visibility' : 'visibility_off'}
                </span>
              </button>
              <button
                type="button"
                onClick={copyToken}
                className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant"
                aria-label={translateApiKey('copyTokenAria')}
              >
                <span className="material-symbols-outlined text-xl">content_copy</span>
              </button>
            </div>
          </div>
          {copyOk && <p className="text-primary text-xs mt-2">{translateApiKey('copied')}</p>}
          <p className="flex items-start gap-2 text-xs text-on-surface-variant mt-3">
            <span className="material-symbols-outlined text-base shrink-0">info</span>
            {translateApiKey('tokenInfo')}
          </p>
        </div>
      </div>

      {error && <p className="text-error text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-frost bg-surface-container-low/30 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary">autorenew</span>
            <h3 className="font-semibold text-on-surface">{translateApiKey('renewTitle')}</h3>
          </div>
          <p className="text-sm text-on-surface-variant mb-4 flex-1">{translateApiKey('renewDescription')}</p>
          {!showRenewPanel ? (
            <button
              type="button"
              onClick={openRenew}
              className="w-full sm:w-auto border border-primary text-primary px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/10 transition-colors inline-flex items-center justify-center gap-2"
            >
              {translateApiKey('extendValidity')}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          ) : (
            <div className="space-y-4 border-t border-outline-variant/20 pt-4">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
                {translateApiKey('expiration')}
              </p>
              <div className="flex flex-wrap gap-2">
                {EXPIRATION_MONTHS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMonths(m)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      selectedMonths === m
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-frost text-on-surface-variant hover:border-outline-variant'
                    }`}
                  >
                    {m}
                    <span className="text-on-surface-variant text-xs ml-1">{translateApiKey('monthSuffix')}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowRenewPanel(false)}
                  disabled={renewing}
                  className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface"
                >
                  {translateApiKey('cancel')}
                </button>
                <button
                  type="button"
                  onClick={renew}
                  disabled={renewing}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold disabled:opacity-50"
                >
                  {renewing ? translateApiKey('renewing') : translateApiKey('renewNow')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-error/30 bg-error-container/5 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-error">sync_problem</span>
            <h3 className="font-semibold text-on-surface">{translateApiKey('revokeTitle')}</h3>
          </div>
          <p className="text-sm text-on-surface-variant mb-4 flex-1">{translateApiKey('revokeDescription')}</p>
          {!showRevokeConfirm ? (
            <button
              type="button"
              onClick={openRevoke}
              className="w-full sm:w-auto border border-error text-error px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-error/10 transition-colors inline-flex items-center justify-center gap-2"
            >
              {translateApiKey('revokeAction')}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          ) : (
            <div className="space-y-4 border-t border-error/20 pt-4">
              <div className="flex gap-3 rounded-lg bg-error/10 p-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-error shrink-0">warning</span>
                <p>{translateApiKey('revokeWarning')}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowRevokeConfirm(false)}
                  disabled={revoking}
                  className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface"
                >
                  {translateApiKey('cancel')}
                </button>
                <button
                  type="button"
                  onClick={revoke}
                  disabled={revoking}
                  className="px-4 py-2 rounded-lg bg-error text-on-error-container text-sm font-semibold disabled:opacity-50"
                >
                  {revoking ? translateApiKey('working') : translateApiKey('confirmRevoke')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-frost bg-surface-container-low/30 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="material-symbols-outlined text-primary text-2xl">menu_book</span>
        <div className="flex-1">
          <h3 className="font-medium text-on-surface">{translateApiKey('documentationTitle')}</h3>
          <p className="text-sm text-on-surface-variant">{translateApiKey('documentationBody')}</p>
        </div>
        <a
          href="https://docs.verifik.co/authentication/renew-your-token-jwt"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 border border-frost px-4 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-surface-container-high transition-colors shrink-0"
        >
          {translateApiKey('viewDocs')}
          <span className="material-symbols-outlined text-lg">open_in_new</span>
        </a>
      </div>
    </div>
  );
}
