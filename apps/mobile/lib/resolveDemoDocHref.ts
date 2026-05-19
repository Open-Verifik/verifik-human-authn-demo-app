export type ResolvedDocLink =
  | { kind: 'internal'; path: string }
  | { kind: 'webview'; url: string };

const DOCS_ORIGIN = 'https://docs.verifik.co';

/** Maps related-doc / API-ref hrefs to in-app navigation or an in-app WebView URL. */
export const resolveDemoDocHref = (href: string): ResolvedDocLink => {
  const trimmed = href.trim();
  if (!trimmed) {
    return { kind: 'webview', url: DOCS_ORIGIN };
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { kind: 'webview', url: trimmed };
  }

  if (trimmed.startsWith('/demos/')) {
    return { kind: 'internal', path: trimmed };
  }

  if (trimmed.startsWith('/')) {
    return { kind: 'webview', url: `${DOCS_ORIGIN}${trimmed}` };
  }

  return { kind: 'internal', path: `/${trimmed}` };
};

export const isAllowedDocWebViewUrl = (url: string): boolean => {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === 'docs.verifik.co' ||
      hostname.endsWith('.verifik.co') ||
      hostname === 'verifik.co'
    );
  } catch {
    return false;
  }
};
