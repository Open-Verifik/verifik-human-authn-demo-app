import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { SITE_URL } from '@/lib/site-url';

type Href = Parameters<typeof getPathname>[0]['href'];

interface IndexableRoute {
  href: Href;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
}

/** Public indexable paths (single source for sitemap + llms.txt). */
export const INDEXABLE_HREFS: Href[] = [
  '/',
  '/home',

  '/demos/create-collection',
  '/demos/create-person',
  '/demos/create-person-with-liveness',
  '/demos/update-person',
  '/demos/delete-person',

  '/demos/search-person',
  '/demos/search-live-person',
  '/demos/search-active-user',
  '/demos/search-crops',

  '/demos/detect-face',
  '/demos/face-comparison',
  '/demos/face-comparison-liveness',
  '/demos/verify-face',
  '/demos/liveness',

  '/demos/humanid',
  '/demos/humanid-create',
  '/demos/humanid-create-qr',
  '/demos/humanid-decrypt',
  '/demos/humanid-preview',
];

const routeMeta: Record<string, { priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = {
  '/': { priority: 1.0, changeFrequency: 'daily' },
  '/home': { priority: 0.9, changeFrequency: 'daily' },

  '/demos/create-collection': { priority: 0.7, changeFrequency: 'weekly' },
  '/demos/create-person': { priority: 0.7, changeFrequency: 'weekly' },
  '/demos/create-person-with-liveness': { priority: 0.7, changeFrequency: 'weekly' },
  '/demos/update-person': { priority: 0.6, changeFrequency: 'weekly' },
  '/demos/delete-person': { priority: 0.5, changeFrequency: 'weekly' },

  '/demos/search-person': { priority: 0.7, changeFrequency: 'weekly' },
  '/demos/search-live-person': { priority: 0.7, changeFrequency: 'weekly' },
  '/demos/search-active-user': { priority: 0.7, changeFrequency: 'weekly' },
  '/demos/search-crops': { priority: 0.6, changeFrequency: 'weekly' },

  '/demos/detect-face': { priority: 0.7, changeFrequency: 'weekly' },
  '/demos/face-comparison': { priority: 0.8, changeFrequency: 'weekly' },
  '/demos/face-comparison-liveness': { priority: 0.8, changeFrequency: 'weekly' },
  '/demos/verify-face': { priority: 0.7, changeFrequency: 'weekly' },
  '/demos/liveness': { priority: 0.8, changeFrequency: 'weekly' },

  '/demos/humanid': { priority: 0.7, changeFrequency: 'weekly' },
  '/demos/humanid-create': { priority: 0.7, changeFrequency: 'weekly' },
  '/demos/humanid-create-qr': { priority: 0.6, changeFrequency: 'weekly' },
  '/demos/humanid-decrypt': { priority: 0.7, changeFrequency: 'weekly' },
  '/demos/humanid-preview': { priority: 0.6, changeFrequency: 'weekly' },
};

const routes: IndexableRoute[] = INDEXABLE_HREFS.map((href) => {
  const meta = routeMeta[href as string];
  return {
    href,
    priority: meta?.priority ?? 0.5,
    changeFrequency: meta?.changeFrequency ?? 'weekly',
  };
});

function absoluteUrl(locale: string, href: Href): string {
  const path = getPathname({ locale, href });
  return `${SITE_URL}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    const languages: Record<string, string> = {};
    for (const locale of routing.locales) {
      languages[locale] = absoluteUrl(locale, route.href);
    }
    languages['x-default'] = absoluteUrl(routing.defaultLocale, route.href);

    for (const locale of routing.locales) {
      entries.push({
        url: absoluteUrl(locale, route.href),
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages },
      });
    }
  }

  return entries;
}
