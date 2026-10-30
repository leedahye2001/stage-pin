import type { Concert } from '../api/concerts';

export function kopisSourceId(concert: Concert): string | null {
  if (concert.source !== 'KOPIS') return null;
  try {
    const url = new URL(concert.officialUrl);
    if (!['kopis.or.kr', 'www.kopis.or.kr'].includes(url.hostname)) return null;
    const id = url.searchParams.get('mt20Id');
    return id && /^PF\d{1,12}$/.test(id) ? id : null;
  } catch { return null; }
}

export function mergeMapConcerts(favorites: Concert[], refreshed: Concert[], home: Concert[]): Concert[] {
  return [...new Map([...favorites.filter(concert => concert.source !== 'KOPIS'), ...refreshed, ...home]
    .map(concert => [concert.id, concert])).values()];
}
