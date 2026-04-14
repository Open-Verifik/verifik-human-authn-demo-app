import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('NotFound');

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-surface text-on-surface">
      <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
      <p className="text-on-surface-variant text-center max-w-md mb-8">{t('body')}</p>
      <Link href="/" className="text-primary font-semibold underline underline-offset-4">
        {t('homeLink')}
      </Link>
    </main>
  );
}
