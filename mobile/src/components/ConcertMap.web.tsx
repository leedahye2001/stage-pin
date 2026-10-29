import Ionicons from '@expo/vector-icons/Ionicons';
import { createElement, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Concert } from '@/api/concerts';
import { KakaoConcertMap } from '@/components/KakaoConcertMap.web';
import { colors, radius, spacing } from '@/theme/tokens';

import 'leaflet/dist/leaflet.css';

type ConcertMapProps = {
  concerts: Concert[];
  onSelect: (concertId: string) => void;
  initialRealMap?: boolean;
  height?: number;
};

function KoreaSilhouette() {
  // Rounded to keep the map playful while preserving the projected venue area.
  return createElement(
    'svg',
    {
      'aria-hidden': true,
      style: { height: 268, left: '50%', marginLeft: -105, opacity: 0.78, position: 'absolute', top: 16, width: 210 },
      viewBox: '0 0 180 230',
    },
    createElement('path', {
      d: 'M105 8C122 18 138 36 149 55C161 75 166 94 161 112C156 132 143 147 127 157C111 168 94 175 74 178C56 181 42 177 35 169C28 161 31 150 40 138C49 126 54 115 52 104C50 94 41 89 31 84C20 79 16 71 20 64C24 56 35 52 44 48C53 44 56 38 53 32C49 25 47 19 52 15C59 9 72 10 84 12C92 13 99 12 105 8Z',
      fill: '#D1CBDF',
      stroke: '#AAA1C2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: 3,
    }),
    createElement('ellipse', {
      cx: 45,
      cy: 213,
      fill: '#D1CBDF',
      rx: 12,
      ry: 5,
      stroke: '#AAA1C2',
      strokeWidth: 3,
    }),
    createElement('ellipse', {
      cx: 170,
      cy: 61,
      fill: '#D1CBDF',
      rx: 4.5,
      ry: 5.5,
      stroke: '#AAA1C2',
      strokeWidth: 2.5,
    }),
    createElement('circle', {
      cx: 178,
      cy: 69,
      fill: '#D1CBDF',
      r: 2.8,
      stroke: '#AAA1C2',
      strokeWidth: 2,
    }),
  );
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

export function ConcertMap({ concerts, onSelect, initialRealMap = false, height = 300 }: ConcertMapProps) {
  const [showRealMap, setShowRealMap] = useState(initialRealMap);
  const venues = useMemo(() => Array.from(
    new Map(concerts.map((concert) => [concert.venue.name, concert])).values(),
  ).slice(0, 30), [concerts]);
  const useKakaoMap = Boolean(process.env.EXPO_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY);

  return (
    <View style={[styles.map, { height }]}>
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
          <View style={[styles.land, styles.landLeft]} />
          <View style={[styles.land, styles.landRight]} />
          <KoreaSilhouette />
          <Ionicons color="#A59DBD" name="sparkles" size={13} style={styles.sparkleLeft} />
          <Text style={styles.mapLabel}>나의 공연 발자국</Text>
          <Ionicons color="#A59DBD" name="sparkles" size={11} style={styles.sparkleRight} />

          <View pointerEvents="box-none" style={styles.markerLayer}>
            {venues.slice(0, 12).map((concert) => {
              const left = clampPercent(((concert.venue.longitude - 125.8) / 4) * 100);
              const top = clampPercent(((38.7 - concert.venue.latitude) / 5.7) * 100);

              return (
                <Pressable
                  accessibilityLabel={`${concert.venue.city} 공연 보기`}
                  key={concert.id}
                  onPress={() => onSelect(concert.id)}
                  style={[styles.marker, { left: `${left}%`, top: `${top}%` }]}
                >
                  <View style={styles.pin}>
                    <Ionicons color={colors.white} name="musical-note" size={12} />
                  </View>
                  <Text numberOfLines={1} style={styles.city}>{concert.venue.name}</Text>
                </Pressable>
              );
            })}
          </View>
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
  land: {
    backgroundColor: '#D7D1EA',
    borderRadius: 999,
    opacity: 0.8,
    position: 'absolute',
    transform: [{ rotate: '-12deg' }],
  },
  landLeft: {
    height: 170,
    left: -35,
    top: 80,
    width: 190,
  },
  landRight: {
    height: 220,
    right: -22,
    top: 34,
    width: 245,
  },
  mapLabel: {
    color: '#8B849F',
    fontSize: 12,
    fontWeight: '900',
    left: 34,
    letterSpacing: -0.2,
    position: 'absolute',
    top: spacing.md,
  },
  sparkleLeft: {
    left: spacing.md,
    position: 'absolute',
    top: 17,
  },
  sparkleRight: {
    left: 136,
    position: 'absolute',
    top: 13,
  },
  marker: {
    alignItems: 'center',
    position: 'absolute',
    transform: [{ translateX: -14 }, { translateY: -14 }],
  },
  markerLayer: {
    height: 268,
    left: '50%',
    marginLeft: -105,
    position: 'absolute',
    top: 16,
    width: 210,
  },
  pin: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.white,
    borderRadius: 999,
    borderWidth: 3,
    boxShadow: '0 4px 10px rgba(71, 50, 168, 0.35)',
    height: 28,
    justifyContent: 'center',
    width: 28,
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
