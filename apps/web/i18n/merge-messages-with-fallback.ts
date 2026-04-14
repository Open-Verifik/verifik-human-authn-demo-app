/**
 * Deep-merge `override` onto `fallback` so missing or empty leaf strings
 * keep English. New keys only in `override` are preserved.
 */
export const mergeMessagesWithFallback = (
  fallback: Record<string, unknown>,
  override: Record<string, unknown> | undefined | null,
): Record<string, unknown> => {
  if (!override || typeof override !== 'object' || Array.isArray(override)) {
    return { ...fallback };
  }

  const result: Record<string, unknown> = { ...fallback };

  for (const key of Object.keys(fallback)) {
    const fbVal = fallback[key];
    const ovVal = override[key];

    if (ovVal === undefined) {
      continue;
    }

    if (Array.isArray(fbVal) || Array.isArray(ovVal)) {
      result[key] = ovVal;
      continue;
    }

    if (
      fbVal !== null &&
      typeof fbVal === 'object' &&
      !Array.isArray(fbVal) &&
      ovVal !== null &&
      typeof ovVal === 'object' &&
      !Array.isArray(ovVal)
    ) {
      result[key] = mergeMessagesWithFallback(
        fbVal as Record<string, unknown>,
        ovVal as Record<string, unknown>,
      );
      continue;
    }

    if (typeof ovVal === 'string' && ovVal.trim() === '') {
      result[key] = fbVal;
    } else {
      result[key] = ovVal;
    }
  }

  for (const key of Object.keys(override)) {
    if (!(key in fallback)) {
      result[key] = override[key];
    }
  }

  return result;
};
