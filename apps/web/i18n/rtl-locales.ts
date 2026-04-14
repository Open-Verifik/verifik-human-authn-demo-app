const RTL_LOCALES = new Set(['ar']);

export const isRtlLocale = (locale: string): boolean => RTL_LOCALES.has(locale);
