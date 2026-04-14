import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home.demos.face-comparison' });
  const title = t('title');
  const description = t('description');
  return {
    title,
    description,
    openGraph: { title, description, images: [`/og?demo=face-comparison&locale=${locale}`] },
    twitter: { title, description, images: [`/og?demo=face-comparison&locale=${locale}`] },
  };
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
