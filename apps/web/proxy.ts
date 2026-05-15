import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

/**
 * Exclude extensionless TF.js / face-api weight shards under `public/face-models` (only `.*\..*`
 * would skip typical static files; shard filenames have no extension).
 */
export const config = {
  matcher: ['/((?!api|_next|_vercel|face-models|.*\\..*).*)'],
};
