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
  // Simplified from Natural Earth 1:10m public-domain country geometry.
  return createElement(
    'svg',
    {
      'aria-hidden': true,
      style: { height: '88%', left: '50%', marginLeft: -115, opacity: 0.72, position: 'absolute', top: '4%', width: 230 },
      viewBox: '0 0 180 260',
    },
    createElement('path', {
      d: 'M109 114L136 154L135 181L140 182L136 195L125 207L115 202L116 206L109 208L112 207L111 212L101 210L102 206L97 209L93 208L89 210L94 212L91 218L88 211L84 213L88 219L84 219L86 220L84 222L78 220L84 216L81 214L72 223L69 219L63 226L63 219L57 219L57 214L62 219L59 216L66 218L59 215L67 213L64 211L59 213L61 208L58 210L59 208L56 205L61 207L58 202L62 194L67 194L62 191L71 185L63 183L72 180L67 182L62 179L65 178L62 171L65 170L62 170L62 163L61 166L59 163L57 167L53 162L58 157L59 161L59 156L62 160L65 159L63 155L66 158L70 157L71 162L76 156L73 158L72 154L69 155L72 151L67 153L66 149L72 149L65 146L63 136L69 139L67 132L77 123L101 122L109 114ZM74 248L65 254L57 255L54 252L62 246L74 248ZM60 221L53 224L56 219L60 221ZM102 213L101 216L97 215L96 211L98 210L102 213ZM119 211L115 216L115 212L112 211L118 207L119 211ZM63 140L59 140L60 135L63 140ZM109 114L101 122L77 123L65 136L60 133L53 137L51 133L40 129L43 132L34 138L38 133L33 135L32 132L24 132L32 128L17 127L25 124L22 121L28 113L41 114L28 109L35 98L36 94L34 93L36 89L28 89L19 84L16 89L14 83L8 80L12 77L9 75L22 65L50 55L63 43L67 33L73 31L78 38L104 42L108 37L101 26L124 25L134 14L143 14L147 0L153 0L167 18L160 18L142 35L141 40L145 42L143 56L131 60L127 66L116 70L116 73L108 77L100 77L88 85L89 96L87 93L84 94L87 95L85 99L94 101L109 114Z',
      fill: '#C8C3D8',
    }),
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
          <View style={[styles.land, styles.landLeft]} />
          <View style={[styles.land, styles.landRight]} />
          <KoreaSilhouette />
          <Text style={styles.mapLabel}>MY STAGE TRAIL</Text>

          <View pointerEvents="box-none" style={styles.markerLayer}>
            {venues.slice(0, 12).map((concert, index) => {
              const left = ((concert.venue.longitude - 124) / 7.2) * 100 + (index % 3) * 0.5;
              const top = ((43 - concert.venue.latitude) / 10) * 100 + (index % 2);

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
  markerLayer: {
    height: '88%',
    left: '50%',
    marginLeft: -115,
    position: 'absolute',
    top: '4%',
    width: 230,
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
