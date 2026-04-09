import { all } from 'country-codes-list';

export type PhoneCountry = {
  iso2: string;
  name: string;
  /** E.g. "+507" — must match Verifik middleware `^\\+\\d{1,3}$` */
  dialCode: string;
  flag: string;
};

/**
 * Countries whose ITU calling codes are longer than three digits are omitted — the public
 * API rejects `countryCode` values that do not match `^\\+\\d{1,3}$`.
 */
const raw = all();

export const PHONE_COUNTRIES: PhoneCountry[] = raw
  .filter((c) => /^\d{1,3}$/.test(c.countryCallingCode))
  .map((c) => ({
    iso2: c.countryCode,
    name: c.countryNameEn,
    dialCode: `+${c.countryCallingCode}`,
    flag: c.flag,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const DEFAULT_PHONE_COUNTRY_ISO2 = 'US';

export const getPhoneCountryByIso2 = (iso2: string): PhoneCountry | undefined =>
  PHONE_COUNTRIES.find((c) => c.iso2 === iso2);

export const filterPhoneCountries = (query: string): PhoneCountry[] => {
  const q = query.trim().toLowerCase();
  if (!q) return PHONE_COUNTRIES;

  const digits = q.replace(/\D/g, '');

  return PHONE_COUNTRIES.filter((c) => {
    if (c.name.toLowerCase().includes(q)) return true;
    if (c.dialCode.toLowerCase().includes(q)) return true;
    if (c.iso2.toLowerCase().includes(q)) return true;
    if (digits.length > 0 && c.dialCode.replace(/\D/g, '').includes(digits)) return true;
    return false;
  });
};
