import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { VenueSummary } from '@/api/concerts';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { colors, radius } from '@/theme/tokens';

type KakaoWindow = Window & {
  kakao?: {
    maps: {
      LatLng: new (latitude: number, longitude: number) => unknown;
      Map: new (container: HTMLElement, options: { center: unknown; level: number }) => unknown;
      Marker: new (options: { map: unknown; position: unknown; title: string }) => unknown;
      load: (callback: () => void) => void;
    };
  };
};

let kakaoMapsPromise: Promise<NonNullable<KakaoWindow['kakao']>['maps']> | undefined;

function loadKakaoMaps(appKey: string) {
  if (kakaoMapsPromise) return kakaoMapsPromise;

  kakaoMapsPromise = new Promise((resolve, reject) => {
    const kakaoWindow = window as KakaoWindow;
    const ready = () => kakaoWindow.kakao?.maps.load(() => resolve(kakaoWindow.kakao!.maps));
    if (kakaoWindow.kakao?.maps) return ready();

    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.onload = ready;
    script.onerror = () => reject(new Error('카카오맵 SDK를 불러오지 못했습니다.'));
    document.head.appendChild(script);
  });

  return kakaoMapsPromise;
}

export function VenueMap({ venue }: { venue: VenueSummary }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const appKey = process.env.EXPO_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY;
  const kakaoMapUrl = `https://map.kakao.com/link/map/${encodeURIComponent(venue.name)},${venue.latitude},${venue.longitude}`;

  useEffect(() => {
    if (!appKey || !containerRef.current) return;
    let cancelled = false;

    loadKakaoMaps(appKey)
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const position = new maps.LatLng(venue.latitude, venue.longitude);
        const map = new maps.Map(containerRef.current, { center: position, level: 4 });
        new maps.Marker({ map, position, title: venue.name });
        setReady(true);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [appKey, venue.latitude, venue.longitude, venue.name]);

  if (!appKey || failed) {
    return (
      <View style={[styles.container, styles.fallback]}>
        <Text style={styles.fallbackTitle}>카카오맵에서 공연장 위치를 확인해요</Text>
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(kakaoMapUrl)}>
          <Text style={styles.link}>카카오맵 열기 →</Text>
        </Pressable>
      </View>
    );
  }

  return <View style={styles.container}>
    {!ready ? <LoadingSkeleton kind="map" label="공연장 지도 불러오는 중" /> : null}
    <div aria-label={`${venue.name} 카카오맵`} ref={containerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
  </View>;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    height: 190,
    marginTop: 14,
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    backgroundColor: '#FEE500',
    justifyContent: 'center',
  },
  fallbackTitle: {
    color: '#191919',
    fontSize: 14,
    fontWeight: '700',
  },
  link: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
});
