'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  authSession,
  getUpdatedClientFromPutResponse,
  updateClient,
} from '@humanauthn/api-client';
import { PHONE_COUNTRIES } from '../../../lib/phoneCountries';
import { readUserCreditsFromSessionUser, useAuthStore } from '../../store/authStore';

type FormState = {
  name: string;
  email: string;
  company: string;
  address: string;
  countryCode: string;
  phone: string;
};

export default function SettingsProfilePage() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const setUserDisplay = useAuthStore((s) => s.setUserDisplay);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    company: '',
    address: '',
    countryCode: '+1',
    phone: '',
  });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoadError(null);
      const sess = await authSession(token, { origin: 'app' });
      if (cancelled) return;
      if (sess.error) {
        setLoadError(sess.error);
        setLoaded(true);
        return;
      }
      const user = sess.data?.user;
      if (!user || typeof user !== 'object') {
        setLoadError('Could not load profile.');
        setLoaded(true);
        return;
      }
      const u = user as Record<string, unknown>;
      const cc = typeof u.countryCode === 'string' && u.countryCode ? u.countryCode : '+1';
      setForm({
        name: typeof u.name === 'string' ? u.name : '',
        email: typeof u.email === 'string' ? u.email : '',
        company: typeof u.company === 'string' ? u.company : '',
        address: typeof u.address === 'string' ? u.address : '',
        countryCode: cc,
        phone: typeof u.phone === 'string' ? u.phone : '',
      });
      const av = u.avatar;
      if (typeof av === 'string' && av) setAvatar(av);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onFile = useCallback((files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!/\.(png|jpe?g)$/i.test(file.name)) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const r = reader.result;
      if (typeof r === 'string') setAvatar(r);
    };
    reader.readAsDataURL(file);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveOk(false);
    if (!token || !userId) {
      setSaveError('Not signed in.');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      company: form.company.trim() || undefined,
      address: form.address.trim() || undefined,
      email: form.email.trim(),
      phone: form.phone,
      countryCode: form.countryCode,
      ...(avatar ? { avatar } : {}),
    };
    const res = await updateClient(token, userId, payload);
    setSaving(false);
    if (res.error) {
      setSaveError(res.error);
      return;
    }
    const updated = getUpdatedClientFromPutResponse(res.data);
    if (updated) {
      const name = typeof updated.name === 'string' ? updated.name : form.name;
      const email = typeof updated.email === 'string' ? updated.email : form.email;
      const credits = readUserCreditsFromSessionUser(updated);
      setUserDisplay({
        userName: name || null,
        userEmail: email || null,
        ...(credits != null ? { credits } : {}),
      });
    } else {
      setUserDisplay({
        userName: form.name || null,
        userEmail: form.email || null,
      });
    }
    setSaveOk(true);
    setTimeout(() => setSaveOk(false), 4000);
  };

  if (loadError) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <p className="text-error text-sm">{loadError}</p>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <div className="h-8 w-48 rounded-lg bg-surface-container-high animate-pulse mb-4" />
        <div className="h-64 rounded-2xl bg-surface-container-high animate-pulse" />
      </div>
    );
  }

  const prefixCountry = PHONE_COUNTRIES.find((c) => c.dialCode === form.countryCode);
  const prefixDisplay = prefixCountry
    ? `${prefixCountry.dialCode} ${prefixCountry.name}`
    : form.countryCode;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-10 pb-safe">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface">Profile</h1>
        <p className="text-on-surface-variant mt-2 text-sm md:text-base">Manage your Verifik profile.</p>
      </div>

      <div className="rounded-2xl border border-frost bg-surface-container-low/40 overflow-hidden mb-6">
        <div className="p-6 md:p-8 flex flex-col gap-10">
          <div className="border-b border-outline-variant/20 pb-10">
            <div className="flex flex-col gap-1 mb-6">
              <h2 className="text-lg font-semibold text-on-surface">Photo</h2>
              <p className="text-sm text-on-surface-variant">Upload a profile image (.png, .jpeg, .jpg).</p>
            </div>
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="shrink-0">
                <div className="w-32 h-32 rounded-full bg-surface-container-high border-2 border-dashed border-outline-variant flex items-center justify-center overflow-hidden">
                  {avatar ? (
                    <img src={avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant">person</span>
                  )}
                </div>
              </div>
              <div className="flex-1 w-full">
                <label className="flex flex-col items-center justify-center w-full min-h-[8rem] bg-surface-container-high/50 rounded-xl border-2 border-dashed border-outline-variant cursor-pointer hover:bg-surface-container-high transition-colors">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => onFile(e.target.files)}
                  />
                  <span className="material-symbols-outlined text-on-surface-variant text-3xl mb-2">cloud_upload</span>
                  <p className="text-sm text-on-surface-variant text-center px-4">
                    <span className="font-semibold text-on-surface">Drag and drop</span> or click to upload
                  </p>
                </label>
                {avatar && (
                  <div className="flex justify-end mt-3">
                    <button
                      type="button"
                      onClick={() => setAvatar(undefined)}
                      className="text-sm font-medium text-error hover:underline"
                    >
                      Remove photo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-1 mb-6">
              <h2 className="text-lg font-semibold text-on-surface">Personal information</h2>
              <p className="text-sm text-on-surface-variant">This information is associated with your account.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-on-surface">Full name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="h-11 px-4 bg-surface-container-high/50 border border-frost rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-full"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-on-surface">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="h-11 px-4 bg-surface-container-high/50 border border-frost rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-full"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-on-surface">Prefix</label>
                <input
                  type="text"
                  value={prefixDisplay}
                  readOnly
                  className="h-11 px-4 bg-surface-container/80 border border-frost rounded-lg text-on-surface-variant cursor-not-allowed w-full"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-on-surface">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  readOnly
                  className="h-11 px-4 bg-surface-container/80 border border-frost rounded-lg text-on-surface-variant cursor-not-allowed w-full"
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-on-surface">Company</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="h-11 px-4 bg-surface-container-high/50 border border-frost rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-full"
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-on-surface">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="h-11 px-4 bg-surface-container-high/50 border border-frost rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-full"
                />
              </div>
            </div>

            {saveError && <p className="text-error text-sm mb-4">{saveError}</p>}
            {saveOk && <p className="text-primary text-sm mb-4">Profile saved.</p>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary text-on-primary px-8 h-11 rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
