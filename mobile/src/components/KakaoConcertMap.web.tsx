import { createElement, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Concert } from '@/api/concerts';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

type KakaoMapsApi = {
  LatLng: new (latitude: number, longitude: number) => unknown;
  Map: new (container: HTMLElement, options: { center: unknown; level: number }) => unknown;
  Marker: new (options: { map: unknown; position: unknown; title: string }) => unknown;
  event: {
    addListener: (target: unknown, event: string, listener: () => void) => void;
  };
  load: (callback: () => void) => void;
};

declare global {
  interface Window {
    kakao?: { maps: KakaoMapsApi };
  }
}

type KakaoConcertMapProps = {
  concerts: Concert[];
  onSelect: (concertId: string) => void;
};

const scriptId = 'stagepin-kakao-map-sdk';

function loadKakaoMapSdk(appKey: string) {
  return new Promise<KakaoMapsApi>((resolve, reject) => {
    const finish = () => window.kakao?.maps.load(() => resolve(window.kakao!.maps));
    if (window.kakao?.maps) {
      finish();
      return;
    }

    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener('load', finish, { once: true });
      existing.addEventListener('error', () => reject(new Error('Kakao Maps SDK load failed')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', () => reject(new Error('Kakao Maps SDK load failed')), { once: true });
    document.head.appendChild(script);
  });
}

export function KakaoConcertMap({ concerts, onSelect }: KakaoConcertMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const appKey = process.env.EXPO_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY;

  useEffect(() => {
    if (!appKey || !containerRef.current) return;
    let cancelled = false;

    loadKakaoMapSdk(appKey)
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const map = new maps.Map(containerRef.current, {
          center: new maps.LatLng(36.4, 127.8),
          level: 13,
        });
        concerts.forEach((concert) => {
          const marker = new maps.Marker({
            map,
            position: new maps.LatLng(concert.venue.latitude, concert.venue.longitude),
            title: concert.venue.name,
          });
          maps.event.addListener(marker, 'click', () => onSelect(concert.id));
        });
        setReady(true);
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
    };
  }, [appKey, concerts, onSelect]);

  if (!appKey || failed) return null;

  return (
    <View style={styles.container}>
      {!ready ? <LoadingSkeleton kind="map" label="카카오맵 불러오는 중" /> : null}
      {createElement('div', {
        ref: containerRef,
        style: { height: '100%', inset: 0, position: 'absolute', width: '100%' },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
