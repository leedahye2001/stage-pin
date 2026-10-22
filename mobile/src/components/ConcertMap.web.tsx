import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Concert } from '@/api/concerts';
import { colors, radius, spacing } from '@/theme/tokens';

type ConcertMapProps = {
  concerts: Concert[];
  onSelect: (concertId: string) => void;
};

const markerPositions = [
  { left: '67%', top: '35%' },
  { left: '79%', top: '29%' },
  { left: '18%', top: '52%' },
] as const;

export function ConcertMap({ concerts, onSelect }: ConcertMapProps) {
  return (
    <View style={styles.map}>
      <View style={[styles.land, styles.landLeft]} />
      <View style={[styles.land, styles.landRight]} />
      <Text style={styles.mapLabel}>KOREA STAGES</Text>

      {concerts.map((concert, index) => {
        const position = markerPositions[index % markerPositions.length];

        return (
          <Pressable
            accessibilityLabel={`${concert.venue.city} 공연 보기`}
            key={concert.id}
            onPress={() => onSelect(concert.id)}
            style={[styles.marker, position]}
          >
            <View style={styles.pin} />
            <Text style={styles.city}>{concert.venue.city.toUpperCase()}</Text>
          </Pressable>
        );
      })}

      <View style={styles.legend}>
        <View style={styles.legendDot} />
        <Text style={styles.legendText}>예정 공연</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    backgroundColor: '#E9E6F6',
    borderRadius: radius.lg,
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
  pin: {
    backgroundColor: colors.primary,
    borderColor: colors.white,
    borderRadius: 999,
    borderWidth: 4,
    boxShadow: '0 4px 10px rgba(71, 50, 168, 0.35)',
    height: 22,
    width: 22,
  },
  city: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    color: colors.text,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 4,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  legend: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: radius.pill,
    bottom: spacing.md,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    position: 'absolute',
    right: spacing.md,
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
});
