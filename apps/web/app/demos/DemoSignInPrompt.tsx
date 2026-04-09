'use client';

import Link from 'next/link';

type Props = {
  className?: string;
};

export default function DemoSignInPrompt({ className = '' }: Props) {
  return (
    <div
      className={`rounded-xl border border-outline-variant/20 bg-surface-container-low/80 p-6 text-center ${className}`}
    >
      <p className="text-on-surface-variant text-sm mb-4">
        You must sign in to try the demos.
      </p>
      <Link
        href="/auth"
        className="inline-flex items-center justify-center gap-2 bg-primary-cta text-on-primary-container px-6 py-3 rounded-lg font-bold text-sm shadow-primary hover:opacity-90 active:scale-[0.98] transition-all"
      >
        <span className="material-symbols-outlined text-lg">login</span>
        Sign in
      </Link>
    </div>
  );
}
