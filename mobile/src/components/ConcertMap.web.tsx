import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Concert } from '@/api/concerts';
import { colors, radius, spacing } from '@/theme/tokens';

type ConcertMapProps = {
  concerts: Concert[];
  onSelect: (concertId: string) => void;
};

export function ConcertMap({ concerts, onSelect }: ConcertMapProps) {
  const venues = Array.from(
    new Map(concerts.map((concert) => [concert.venue.name, concert])).values(),
  ).slice(0, 12);

  return (
    <View style={styles.map}>
      <View style={[styles.land, styles.landLeft]} />
      <View style={[styles.land, styles.landRight]} />
      <Text style={styles.mapLabel}>KOREA STAGES</Text>

      {venues.map((concert, index) => {
        const left = 10 + ((concert.venue.longitude - 126) / 3.5) * 78 + (index % 3) * 1.5;
        const top = 12 + ((38.6 - concert.venue.latitude) / 5.3) * 72 + (index % 2) * 2;

        return (
          <Pressable
            accessibilityLabel={`${concert.venue.city} 공연 보기`}
            key={concert.id}
            onPress={() => onSelect(concert.id)}
            style={[styles.marker, { left: `${left}%`, top: `${top}%` }]}
          >
            <View style={styles.pin} />
            <Text numberOfLines={1} style={styles.city}>{concert.venue.name}</Text>
          </Pressable>
        );
      })}

      <View style={styles.legend}>
        <View style={styles.legendDot} />
        <Text style={styles.legendText}>공연장 {venues.length}곳</Text>
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
    maxWidth: 120,
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
