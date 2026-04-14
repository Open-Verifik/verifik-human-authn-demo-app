import { INDEXABLE_HREFS } from '@/app/sitemap';
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { SITE_URL } from '@/lib/site-url';
import { buildLlmsTxtBody, type DemoEntry } from '@/lib/llms-body';
import en from '@/messages/en.json';

export const dynamic = 'force-static';

const abs = (href: (typeof INDEXABLE_HREFS)[number]) =>
  `${SITE_URL}${getPathname({ locale: routing.defaultLocale, href })}`;

const demoCatalog = en.home.demos as Record<
  string,
  { badge: string; title: string; description: string }
>;

export function GET() {
  const demoEntries: DemoEntry[] = INDEXABLE_HREFS
    .filter((h) => (h as string).startsWith('/demos/'))
    .map((href) => {
      const slug = (href as string).replace('/demos/', '');
      const card = demoCatalog[slug];
      return {
        href: href as string,
        url: abs(href),
        badge: card?.badge ?? '',
        title: card?.title ?? slug,
        description: card?.description ?? '',
      };
    });

  const localeList = routing.locales.join(', ');
  const body = buildLlmsTxtBody(SITE_URL, demoEntries, localeList);

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
