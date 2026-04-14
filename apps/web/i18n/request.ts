import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { demosMessagesByLocale } from './demos-bundles';
import { mergeMessagesWithFallback } from './merge-messages-with-fallback';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const [enBaseMod, localeBaseMod] = await Promise.all([
    import(`../messages/en.json`),
    import(`../messages/${locale}.json`),
  ]);

  const enBase = enBaseMod.default as Record<string, unknown>;
  const localeBase = localeBaseMod.default as Record<string, unknown>;

  const base =
    locale === routing.defaultLocale
      ? localeBase
      : mergeMessagesWithFallback(enBase, localeBase);

  const enDemos = demosMessagesByLocale.en as Record<string, unknown>;
  const localeDemosRaw = demosMessagesByLocale[locale] as
    | Record<string, unknown>
    | undefined;

  const demos =
    locale === routing.defaultLocale
      ? (localeDemosRaw ?? enDemos)
      : localeDemosRaw
        ? mergeMessagesWithFallback(enDemos, localeDemosRaw)
        : enDemos;

  return {
    locale,
    messages: { ...base, demos },
  };
});
