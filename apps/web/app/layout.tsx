import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from './providers';

const THEME_INIT_SCRIPT = `(function(){try{var k='humanauthn-theme';var t=localStorage.getItem(k);var pref=(t==='light'||t==='dark'||t==='system')?t:'dark';var resolved=pref==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):pref;var r=document.documentElement;r.setAttribute('data-theme',resolved);if(resolved==='dark')r.classList.add('dark');else r.classList.remove('dark');}catch(e){}})();`;

export const metadata: Metadata = {
  title: {
    default: 'HumanAuthn: Biometric API Demo',
    template: '%s | HumanAuthn',
  },
  description:
    'HumanAuthn by Verifik. Enterprise-grade liveness detection, face comparison, and biometric authentication.',
  keywords: [
    'biometric authentication',
    'liveness detection',
    'face comparison',
    'identity verification',
    'Verifik',
    'HumanAuthn',
    'HumanID',
  ],
  authors: [{ name: 'Verifik', url: 'https://verifik.co' }],
  openGraph: {
    type:        'website',
    title:       'HumanAuthn: Biometric API Demo',
    description: 'Enterprise-grade biometric authentication APIs by Verifik',
    siteName:    'HumanAuthn',
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-surface text-on-surface antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
