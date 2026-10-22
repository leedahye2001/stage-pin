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
  // Simplified from Natural Earth 1:10m public-domain South Korea geometry.
  return createElement(
    'svg',
    {
      'aria-hidden': true,
      style: { height: 268, left: '50%', marginLeft: -105, opacity: 0.78, position: 'absolute', top: 16, width: 210 },
      viewBox: '0 0 180 230',
    },
    createElement('path', {
      d: 'M115 3L127 22L147 41L163 66L165 79L161 107L164 109L169 106L170 108L164 129L161 128L160 135L144 147L142 144L131 145L126 141L128 147L121 145L116 149L121 147L119 156L114 151L102 152L102 146L94 151L86 150L80 153L84 157L89 155L87 160L82 161L83 165L79 163L77 154L70 156L77 166L70 166L74 168L69 172L60 168L64 164L63 166L65 166L66 161L70 161L65 159L54 165L49 173L45 171L44 166L42 172L32 178L30 171L33 167L22 166L22 159L30 166L26 161L37 164L25 159L39 157L35 156L35 153L32 158L26 158L29 150L23 152L26 149L20 144L24 143L28 149L29 145L23 140L30 135L31 128L40 128L30 123L39 117L44 119L41 115L47 113L37 113L32 110L48 106L40 109L36 104L31 104L36 102L32 96L35 95L31 92L37 90L31 91L31 79L28 84L24 79L22 85L21 80L17 82L19 80L15 81L15 78L19 77L18 73L21 74L23 70L22 77L25 77L24 75L28 72L25 69L29 68L31 75L32 71L35 73L32 66L37 69L37 72L40 69L45 70L47 79L48 74L56 69L50 71L46 68L50 68L49 65L43 67L48 61L40 63L41 60L39 58L48 58L37 53L38 48L33 38L39 38L39 41L43 43L40 41L39 31L58 17L101 16L109 12L112 5L115 3ZM52 211L47 217L36 220L21 222L16 218L23 211L31 209L45 207L52 211Z',
      fill: '#C8C3D8',
      stroke: '#B8B0D1',
      strokeLinejoin: 'round',
      strokeWidth: 1,
    }),
  );
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

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
