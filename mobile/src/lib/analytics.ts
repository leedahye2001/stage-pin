export function analyticsPageUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.origin !== 'https://stage-pin.vercel.app' || url.pathname.startsWith('/admin')) return null;
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}
