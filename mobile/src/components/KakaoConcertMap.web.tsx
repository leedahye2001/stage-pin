import { createElement, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Concert } from '@/api/concerts';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import type { MapLocation } from '@/lib/current-location';

type KakaoMap = { setCenter: (position: unknown) => void; setLevel: (level: number) => void };
type KakaoMarker = { setMap: (map: KakaoMap | null) => void };

type KakaoMapsApi = {
  LatLng: new (latitude: number, longitude: number) => unknown;
  Map: new (container: HTMLElement, options: { center: unknown; level: number }) => KakaoMap;
  Marker: new (options: { map: KakaoMap; position: unknown; title: string }) => KakaoMarker;
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
  currentLocation?: MapLocation | null;
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

export function KakaoConcertMap({ concerts, onSelect, currentLocation }: KakaoConcertMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const appKey = process.env.EXPO_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY;

  useEffect(() => {
    if (!appKey || !containerRef.current) return;
    const container = containerRef.current;
    let cancelled = false;

    loadKakaoMapSdk(appKey)
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const map = new maps.Map(containerRef.current, {
          center: new maps.LatLng(36.4, 127.8),
          level: 13,
        });
        mapRef.current = map;
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
      .catch(() => { if (!cancelled) setFailed(true); });

    return () => {
      cancelled = true;
      mapRef.current = null;
      container.replaceChildren();
    };
  }, [appKey, concerts, onSelect]);

  useEffect(() => {
    const maps = window.kakao?.maps;
    const map = mapRef.current;
    if (!ready || !currentLocation || !maps || !map) return;
    const position = new maps.LatLng(currentLocation.latitude, currentLocation.longitude);
    map.setCenter(position);
    map.setLevel(5);
    const marker = new maps.Marker({ map, position, title: '현재 위치' });
    return () => marker.setMap(null);
  }, [currentLocation, ready]);

  if (!appKey || failed) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}><Text>지도를 불러오지 못했어요. 아래 장소 목록에서 공연을 확인해 주세요.</Text></View>;

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
