import { Analytics } from '@vercel/analytics/react';
import { analyticsPageUrl } from '@/lib/analytics';

export function WebAnalytics() {
  if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined'
    || window.location.origin !== 'https://stage-pin.vercel.app') return null;

  return <Analytics beforeSend={(event) => {
    const url = analyticsPageUrl(event.url);
    return url ? { ...event, url } : null;
  }} />;
}
