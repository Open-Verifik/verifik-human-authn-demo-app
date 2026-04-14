/**
 * Canonical production URL used for sitemap, robots, OG, and llms.txt.
 * Falls back to localhost so dev builds still produce valid absolute URLs.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ?? 'http://localhost:3000';
