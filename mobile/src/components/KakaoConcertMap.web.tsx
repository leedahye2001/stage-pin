import { createElement, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Concert } from '@/api/concerts';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import type { MapLocation } from '@/lib/current-location';

type Bounds = { extend: (position: unknown) => void };
type KakaoMap = { getCenter: () => unknown; setCenter: (position: unknown) => void; setLevel: (level: number) => void; setBounds: (bounds: Bounds) => void; relayout: () => void };
type Overlay = { setMap: (map: KakaoMap | null) => void };
type KakaoMapsApi = {
  LatLng: new (latitude: number, longitude: number) => unknown;
  LatLngBounds: new () => Bounds;
  Map: new (container: HTMLElement, options: { center: unknown; level: number }) => KakaoMap;
  Marker: new (options: { map: KakaoMap; position: unknown; title: string }) => Overlay;
  CustomOverlay: new (options: { map: KakaoMap; position: unknown; content: HTMLElement; yAnchor: number; zIndex: number; clickable: boolean }) => Overlay;
  load: (callback: () => void) => void;
};
declare global { interface Window { kakao?: { maps: KakaoMapsApi } } }
type Props = { concerts: Concert[]; onSelect: (id: string) => void; currentLocation?: MapLocation | null; selectedConcertId?: string; venueCounts?: Record<string, number> };
const scriptId = 'stagepin-kakao-map-sdk';
let sdkPromise: Promise<KakaoMapsApi> | null = null;
function loadSdk(appKey: string): Promise<KakaoMapsApi> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<KakaoMapsApi>((resolve, reject) => {
    const finish = () => window.kakao?.maps.load(() => resolve(window.kakao!.maps));
    if (window.kakao?.maps) { finish(); return; }
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script'); script.id = scriptId; script.async = true;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
      document.head.appendChild(script);
    }
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', () => reject(new Error('Map SDK unavailable')), { once: true });
  }).catch(error => { sdkPromise = null; document.getElementById(scriptId)?.remove(); throw error; });
  return sdkPromise;
}

export function KakaoConcertMap({ concerts, onSelect, currentLocation, selectedConcertId, venueCounts }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const buttonsRef = useRef<{ id: string; button: HTMLButtonElement }[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const appKey = process.env.EXPO_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY;
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => {
    if (!appKey || !containerRef.current) return;
    const container = containerRef.current;
    let cancelled = false;
    let resize: ResizeObserver | undefined;
    loadSdk(appKey).then(maps => {
      if (cancelled) return;
      const map = new maps.Map(container, { center: new maps.LatLng(36.4, 127.8), level: 13 });
      mapRef.current = map;
      resize = new ResizeObserver(() => { const center = map.getCenter(); map.relayout(); map.setCenter(center); }); resize.observe(container);
      setReady(true);
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; resize?.disconnect(); mapRef.current = null; container.replaceChildren(); };
  }, [appKey]);

  useEffect(() => {
    const maps = window.kakao?.maps, map = mapRef.current;
    if (!ready || !maps || !map) return;
    buttonsRef.current = [];
    const overlays = concerts.map(concert => {
      const active = false;
      const button = document.createElement('button');
      button.type = 'button';
      // Set textContent, never HTML: venue names are external data.
      button.textContent = venueCounts ? `${concert.venue.name} · ${venueCounts[concert.id] ?? 1}` : concert.venue.name;
      button.setAttribute('aria-label', `${concert.venue.name} 공연 보기`);
      button.setAttribute('aria-pressed', String(active));
      Object.assign(button.style, { padding: '10px 14px', borderRadius: '24px', border: `1.5px solid ${active ? '#6C4CF1' : '#E5E5E7'}`,
        background: active ? '#6C4CF1' : '#FFFFFF', color: active ? '#FFFFFF' : '#202124', fontSize: '12px', fontWeight: '700',
        boxShadow: '0 3px 12px #00000020', cursor: 'pointer', whiteSpace: 'nowrap', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' });
      button.addEventListener('click', event => { event.stopPropagation(); onSelectRef.current(concert.id); });
      buttonsRef.current.push({ id: concert.id, button });
      const overlay = new maps.CustomOverlay({ map, position: new maps.LatLng(concert.venue.latitude, concert.venue.longitude), content: button, yAnchor: 1.2, zIndex: active ? 10 : 2, clickable: true });
      overlay.setMap(map);
      return overlay;
    });
    return () => overlays.forEach(overlay => overlay.setMap(null));
  }, [ready, concerts, venueCounts]);

  useEffect(() => {
    buttonsRef.current.forEach(({ id, button }) => {
      const active = id === selectedConcertId;
      button.setAttribute('aria-pressed', String(active));
      button.style.background = active ? '#6C4CF1' : '#FFFFFF';
      button.style.color = active ? '#FFFFFF' : '#202124';
      button.style.borderColor = active ? '#6C4CF1' : '#E5E5E7';
      if (button.parentElement) button.parentElement.style.zIndex = active ? '10' : '2';
    });
  }, [ready, concerts, venueCounts, selectedConcertId]);

  useEffect(() => {
    const maps = window.kakao?.maps, map = mapRef.current;
    if (!ready || !maps || !map || !concerts.length || currentLocation || selectedConcertId) return;
    const bounds = new maps.LatLngBounds();
    concerts.forEach(concert => bounds.extend(new maps.LatLng(concert.venue.latitude, concert.venue.longitude)));
    map.setBounds(bounds);
    if (concerts.length === 1) map.setLevel(5);
  }, [ready, concerts, currentLocation, selectedConcertId]);
  useEffect(() => {
    const maps = window.kakao?.maps, map = mapRef.current;
    if (!ready || !maps || !map || !currentLocation) return;
    const position = new maps.LatLng(currentLocation.latitude, currentLocation.longitude);
    map.setLevel(5); map.setCenter(position);
    const marker = new maps.Marker({ map, position, title: '현재 위치' });
    return () => marker.setMap(null);
  }, [ready, currentLocation]);
  useEffect(() => {
    const maps = window.kakao?.maps, map = mapRef.current;
    const selected = concerts.find(concert => concert.id === selectedConcertId);
    if (ready && maps && map && selected) { map.setLevel(4); map.setCenter(new maps.LatLng(selected.venue.latitude, selected.venue.longitude)); }
  }, [ready, selectedConcertId, concerts]);

  if (!appKey || failed) return <View style={s.fallback}><Text>지도를 불러오지 못했어요. 장소 목록에서 공연을 확인해 주세요.</Text></View>;
  return <View style={s.container}>
    {!ready ? <LoadingSkeleton kind="map" label="카카오맵 불러오는 중" /> : null}
    {createElement('div', { ref: containerRef, style: { height: '100%', inset: 0, position: 'absolute', width: '100%' } })}
  </View>;
}
const s = StyleSheet.create({ container: { flex: 1 }, fallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 } });
