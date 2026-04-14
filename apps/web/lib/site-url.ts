/**
 * Canonical public URL used for sitemap, robots, OG, and llms.txt.
 * Defaults to production when env is unset so static output is not localhost.
 * For local-only absolute URLs, set NEXT_PUBLIC_SITE_URL in `.env.local`.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ?? 'https://demos.verifik.co';
