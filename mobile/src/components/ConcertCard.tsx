import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Concert } from '@/api/concerts';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type ConcertCardProps = {
  concert: Concert;
  onPress: () => void;
};

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function ConcertCard({ concert, onPress }: ConcertCardProps) {
  const artistNames = concert.artists.map((artist) => artist.name).join(', ')
    || (concert.status === 'COMPLETED' ? '공연 완료' : '출연진 미등록');
  const isKopis = concert.source === 'KOPIS';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${concert.title} 공연 상세 보기`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {concert.posterUrl ? (
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel={`${concert.title} 포스터`}
          source={{ uri: concert.posterUrl }}
          style={styles.poster}
        />
      ) : (
        <View style={styles.posterFallback}>
          <Text style={styles.dateMonth}>
            {new Intl.DateTimeFormat('en-US', { month: 'short' })
              .format(new Date(concert.startsAt))
              .toUpperCase()}
          </Text>
          <Text style={styles.dateDay}>{new Date(concert.startsAt).getDate()}</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.artistRow}>
          <Text style={styles.artist}>{artistNames}</Text>
          {isKopis ? <Text style={styles.liveBadge}>KOPIS</Text> : null}
        </View>
        <Text numberOfLines={2} style={styles.title}>
          {concert.title}
        </Text>
        <Text style={styles.meta}>
          {isKopis
            ? new Intl.DateTimeFormat('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              }).format(new Date(concert.startsAt))
            : dateFormatter.format(new Date(concert.startsAt))}
        </Text>
        <Text style={styles.meta}>
          {concert.venue.name} · {concert.venue.city}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    width: 196,
  },
  pressed: {
    opacity: 0.72,
  },
  posterFallback: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    height: 264,
    justifyContent: 'center',
    width: '100%',
  },
  dateMonth: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  dateDay: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  poster: {
    backgroundColor: colors.primarySoft,
    height: 264,
    width: '100%',
  },
  content: {
    gap: 3,
    minHeight: 152,
    padding: spacing.md,
  },
  artist: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  artistRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  liveBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
});
