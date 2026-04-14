import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { mergeMessagesWithFallback } from '@/i18n/merge-messages-with-fallback';
import { routing } from '@/i18n/routing';
import { isRtlLocale } from '@/i18n/rtl-locales';
import { Providers } from '../providers';

const THEME_INIT_SCRIPT = `(function(){try{var k='humanauthn-theme';var t=localStorage.getItem(k);var pref=(t==='light'||t==='dark'||t==='system')?t:'dark';var resolved=pref==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):pref;var r=document.documentElement;r.setAttribute('data-theme',resolved);if(resolved==='dark')r.classList.add('dark');else r.classList.remove('dark');}catch(e){}})();`;

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale: string) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'RootLayout' });
  const [enMod, localeMod] = await Promise.all([
    import(`@/messages/en.json`),
    import(`@/messages/${locale}.json`),
  ]);
  const mergedBase =
    locale === routing.defaultLocale
      ? (localeMod.default as Record<string, unknown>)
      : mergeMessagesWithFallback(
          enMod.default as Record<string, unknown>,
          localeMod.default as Record<string, unknown>,
        );
  const messages = mergedBase as { RootLayout: { keywords: string[] } };

  return {
    title: {
      default: t('titleDefault'),
      template: t('titleTemplate'),
    },
    description: t('description'),
    keywords: messages.RootLayout.keywords,
    authors: [{ name: 'Verifik', url: 'https://verifik.co' }],
    openGraph: {
      type: 'website',
      title: t('ogTitle'),
      description: t('ogDescription'),
      siteName: t('ogSiteName'),
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  const dir = isRtlLocale(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface antialiased min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
