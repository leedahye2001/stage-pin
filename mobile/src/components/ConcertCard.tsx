import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Concert } from '@/api/concerts';
import { concertPhase } from '@/lib/home-concerts';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type ConcertCardProps = {
  concert: Concert;
  favorite?: boolean;
  onFavoriteToggle?: () => void;
  onPress: () => void;
};

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function ConcertCard({ concert, favorite, onFavoriteToggle, onPress }: ConcertCardProps) {
  const [now] = useState(Date.now);
  const phase = concertPhase(concert, now);
  const artistNames = concert.artists.map((artist) => artist.name.trim()).filter(Boolean).join(', ');
  const isKopis = concert.source === 'KOPIS';

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${concert.title} 공연 상세 보기`}
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
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
            <Text style={[styles.statusBadge, phase === '진행 중' ? styles.ongoingBadge : phase === '예정' ? styles.upcomingBadge : styles.completedBadge]}>{phase}</Text>
            {isKopis ? <Text style={styles.liveBadge}>KOPIS</Text> : null}
          </View>
          {artistNames ? <View style={styles.artistRow}>
            <Text style={styles.artist}>{artistNames}</Text>
          </View> : null}
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

      {onFavoriteToggle ? (
        <Pressable
          accessibilityLabel={favorite ? `${concert.title} 찜 해제` : `${concert.title} 찜하기`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onFavoriteToggle}
          style={styles.favoriteButton}
        >
          <Ionicons
            color={favorite ? colors.primary : colors.textMuted}
            name={favorite ? 'heart' : 'heart-outline'}
            size={20}
          />
        </Pressable>
      ) : null}

    </View>
  );
}

const styles = StyleSheet.create({
  statusBadge: { borderRadius: 8, overflow: 'hidden', fontSize: 12, lineHeight: 18, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4 },
  completedBadge: { backgroundColor: colors.surfaceMuted, color: colors.textMuted },
  ongoingBadge: { backgroundColor: '#E7F4ED', color: colors.success },
  upcomingBadge: { backgroundColor: colors.primarySoft, color: colors.primary },
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
  favoriteButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    width: 36,
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
    minHeight: 130,
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
