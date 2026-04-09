import type { Metadata } from 'next';
import './globals.css';

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
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-surface text-on-surface antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
