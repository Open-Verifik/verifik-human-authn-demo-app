import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'demos.faceDetection' });
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    openGraph: { title, description, images: [`/og?demo=detect-face&locale=${locale}`] },
    twitter: { title, description, images: [`/og?demo=detect-face&locale=${locale}`] },
  };
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
