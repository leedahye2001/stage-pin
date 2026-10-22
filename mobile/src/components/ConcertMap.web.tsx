import Ionicons from '@expo/vector-icons/Ionicons';
import { createElement, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Concert } from '@/api/concerts';
import { KakaoConcertMap } from '@/components/KakaoConcertMap.web';
import { colors, radius, spacing } from '@/theme/tokens';

import 'leaflet/dist/leaflet.css';

type ConcertMapProps = {
  concerts: Concert[];
  onSelect: (concertId: string) => void;
};

function KoreaSilhouette() {
  return createElement(
    'svg',
    {
      'aria-hidden': true,
      style: { height: '88%', left: '50%', opacity: 0.7, position: 'absolute', top: '4%', transform: 'translateX(-50%)', width: 230 },
      viewBox: '0 0 180 260',
    },
    createElement('path', {
      d: 'M102 8c-14 9-23 20-25 34-2 13 7 19 1 31-5 11-18 15-20 29-2 13 8 21 4 33-3 11-17 18-14 32 2 11 14 15 17 26 4 13-5 24 3 38 7 13 18 21 29 18 9-3 8-17 17-24 8-7 21-8 24-20 4-14-10-22-9-35 1-12 14-19 12-31-2-12-17-13-22-24-5-10 3-20-2-31-4-10-17-15-19-25-3-13 9-25 1-38-5-9-16-12-19-20-4-11 5-21 1-31-4-10-17-13-26-7z',
      fill: '#CBC5DD',
    }),
    createElement('circle', { cx: 54, cy: 232, fill: '#CBC5DD', r: 7 }),
    createElement('circle', { cx: 39, cy: 243, fill: '#CBC5DD', r: 3 }),
  );
}

export function ConcertMap({ concerts, onSelect }: ConcertMapProps) {
  const [showRealMap, setShowRealMap] = useState(false);
  const venues = Array.from(
    new Map(concerts.map((concert) => [concert.venue.name, concert])).values(),
  ).slice(0, 30);
  const useKakaoMap = Boolean(process.env.EXPO_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY);

  return (
    <View style={styles.map}>
      {showRealMap ? (
        useKakaoMap ? (
          <KakaoConcertMap concerts={venues} onSelect={onSelect} />
        ) : (
          <MapContainer
          attributionControl
          center={[36.4, 127.8]}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
          zoom={7}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {venues.map((concert) => (
              <CircleMarker
                center={[concert.venue.latitude, concert.venue.longitude]}
                eventHandlers={{ click: () => onSelect(concert.id) }}
                key={concert.id}
                pathOptions={{ color: colors.white, fillColor: colors.primary, fillOpacity: 1, weight: 3 }}
                radius={9}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  {concert.venue.name}
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        )
      ) : (
        <>
          <KoreaSilhouette />
          <Text style={styles.mapLabel}>MY STAGE TRAIL</Text>

          {venues.slice(0, 12).map((concert, index) => {
            const left = 42 + ((concert.venue.longitude - 126) / 3.5) * 16 + (index % 3) * 0.5;
            const top = 10 + ((38.6 - concert.venue.latitude) / 5.3) * 78 + (index % 2);

            return (
              <Pressable
                accessibilityLabel={`${concert.venue.city} 공연 보기`}
                key={concert.id}
                onPress={() => onSelect(concert.id)}
                style={[styles.marker, { left: `${left}%`, top: `${top}%` }]}
              >
                <View style={styles.pin}>
                  <View style={styles.pinCenter} />
                </View>
                <Text numberOfLines={1} style={styles.city}>{concert.venue.name}</Text>
              </Pressable>
            );
          })}
        </>
      )}

      <View style={styles.legend}>
        <View style={styles.legendDot} />
        <Text style={styles.legendText}>공연장 {venues.length}곳</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setShowRealMap((current) => !current)}
        style={({ pressed }) => [styles.mapToggle, pressed && styles.mapTogglePressed]}
      >
        <Ionicons color={colors.white} name={showRealMap ? 'sparkles' : 'map'} size={15} />
        <Text style={styles.mapToggleText}>{showRealMap ? '발자국 보기' : '실제 지도 보기'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    backgroundColor: '#E9E6F6',
    borderColor: '#DED8F2',
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 300,
    overflow: 'hidden',
    position: 'relative',
  },
  mapLabel: {
    color: '#8B849F',
    fontSize: 11,
    fontWeight: '900',
    left: spacing.md,
    letterSpacing: 1.5,
    position: 'absolute',
    top: spacing.md,
  },
  marker: {
    alignItems: 'center',
    position: 'absolute',
  },
  pin: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.white,
    borderRadius: 999,
    borderWidth: 3,
    boxShadow: '0 4px 10px rgba(71, 50, 168, 0.35)',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  pinCenter: {
    backgroundColor: colors.white,
    borderRadius: 999,
    height: 5,
    opacity: 0.9,
    width: 5,
  },
  city: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    color: colors.text,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 4,
    maxWidth: 120,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  legend: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.pill,
    bottom: spacing.md,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.sm,
    left: spacing.md,
    paddingVertical: 7,
    position: 'absolute',
  },
  legendDot: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  legendText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  mapToggle: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    bottom: spacing.md,
    boxShadow: '0 6px 16px rgba(91, 61, 215, 0.3)',
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 9,
    position: 'absolute',
    right: spacing.md,
  },
  mapTogglePressed: {
    opacity: 0.82,
  },
  mapToggleText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
});
