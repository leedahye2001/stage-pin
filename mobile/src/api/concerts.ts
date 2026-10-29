import { Platform } from 'react-native';

export type ConcertStatus =
  | 'UPCOMING'
  | 'ON_SALE'
  | 'SOLD_OUT'
  | 'COMPLETED'
  | 'CANCELLED';

export type ConcertGenre = 'POPULAR_MUSIC' | 'MUSICAL' | 'PLAY' | 'CLASSICAL';
export type FanCategory = 'IDOL' | 'SOLO' | 'BAND' | 'OTHER';

export type ScheduleType =
  | 'FAN_VERIFICATION_OPEN'
  | 'FAN_VERIFICATION_CLOSE'
  | 'FAN_PRESALE'
  | 'GENERAL_SALE'
  | 'ADDITIONAL_SALE'
  | 'MERCH_SALE'
  | 'DOOR_OPEN'
  | 'SHOW';

export type ArtistSummary = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export type ArtistSearchResult = {
  id: string;
  name: string;
  searchName: string;
  description: string;
  aliases: string[];
  imageUrl: string | null;
  imagePageUrl: string | null;
  imageAttribution: string | null;
  imageLicense: string | null;
};

export type VenueSummary = {
  id: string;
  name: string;
  city: string;
  countryCode: string;
  address: string | null;
  timezone: string;
  latitude: number;
  longitude: number;
};

export type ConcertSchedule = {
  id: string;
  type: ScheduleType;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  sourceUrl: string;
  description: string | null;
};

export type TicketLink = {
  name: string;
  url: string;
};

export type TicketVendor = 'NOL' | 'YES24' | 'MELON' | 'TICKETLINK' | 'OTHER';

export type TicketOpening = {
  id: string;
  concertId: string | null;
  concertTitle: string;
  artistName: string;
  posterUrl: string | null;
  type: ScheduleType;
  opensAt: string;
  timezone: string;
  vendor: TicketVendor;
  ticketUrl: string;
  sourceUrl: string;
  verifiedAt: string;
};

export type Concert = {
  id: string;
  title: string;
  artists: ArtistSummary[];
  venue: VenueSummary;
  startsAt: string;
  endsAt: string | null;
  status: ConcertStatus;
  posterUrl: string | null;
  officialUrl: string;
  source: string;
  genre: ConcertGenre;
  fanCategory: FanCategory;
  verifiedAt: string;
  ticketLinks: TicketLink[];
  schedules: ConcertSchedule[];
};

export type NaverSearchResponse = {
  enabled: boolean;
  items: {
    title: string;
    link: string;
    description: string;
  }[];
};

const localApiUrl = Platform.select({
  android: 'http://10.0.2.2:8080',
  default: 'http://localhost:8080',
});

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? localApiUrl;

export type NoticeField = { value: string; evidence: string };
export type NoticeExtraction = Record<
  'artistName' | 'concertTitle' | 'venue' | 'performancePeriod' | 'fanVerificationPeriod'
  | 'presaleAt' | 'generalSaleAt' | 'vendor' | 'ticketUrl', NoticeField
>;
export type TicketNotice = {
  id: string;
  sourceUrl: string;
  sourceText: string;
  extracted: NoticeExtraction;
  reviewed: NoticeExtraction | null;
  status: 'DRAFT' | 'APPROVED';
  model: string;
  promptVersion: string;
  latencyMs: number;
  totalTokens: number;
  createdAt: string;
  approvedAt: string | null;
};

export async function noticeRequest<T>(key: string, path = '', body?: unknown): Promise<T> {
  const response = await fetch(`${API_URL}/api/v1/admin/notices${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', 'X-StagePin-Admin-Key': key },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.detail || `요청에 실패했어요 (${response.status}).`);
  }
  return response.json();
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    throw new Error(`StagePin API request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function getConcerts(genre: ConcertGenre, query?: string): Promise<Concert[]> {
  const search = query ? `&query=${encodeURIComponent(query)}` : '';
  return request(`/api/v1/concerts?genre=${genre}${search}`);
}

export function getHomeConcerts(): Promise<Concert[]> {
  return request('/api/v1/concerts/home');
}

export function getArtists(query: string): Promise<ArtistSearchResult[]> {
  return request(`/api/v1/artists?query=${encodeURIComponent(query)}`);
}

export function getConcert(id: string, genre: ConcertGenre): Promise<Concert> {
  return request(`/api/v1/concerts/${id}?genre=${genre}`);
}

export function getNaverSearch(query: string): Promise<NaverSearchResponse> {
  return request(`/api/v1/search/naver?query=${encodeURIComponent(query)}`);
}

export function getTicketOpenings(): Promise<TicketOpening[]> {
  return request('/api/v1/ticket-openings');
}
