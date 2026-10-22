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
  schedules: ConcertSchedule[];
};

const localApiUrl = Platform.select({
  android: 'http://10.0.2.2:8080',
  default: 'http://localhost:8080',
});

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? localApiUrl;

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    throw new Error(`StagePin API request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function getConcerts(genre: ConcertGenre): Promise<Concert[]> {
  return request(`/api/v1/concerts?genre=${genre}`);
}

export function getConcert(id: string, genre: ConcertGenre): Promise<Concert> {
  return request(`/api/v1/concerts/${id}?genre=${genre}`);
}
