import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Concert } from '@/api/concerts';
import { concertPhase } from '@/lib/home-concerts';
import { favoritePress } from '@/lib/favorite-press';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type ConcertCardProps = {
  concert: Concert;
  favorite?: boolean;
  onFavoriteToggle?: () => void;
  onPress: () => void;
  fluid?: boolean;
  compact?: boolean;
};

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function ConcertCard({ concert, favorite, onFavoriteToggle, onPress, fluid = false, compact = false }: ConcertCardProps) {
  const [now] = useState(Date.now);
  const phase = concertPhase(concert, now);
  const isKopis = concert.source === 'KOPIS';

  return (
    <View style={[styles.card, (fluid || compact) && { width: '100%' }, compact && styles.listCard]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${concert.title} 공연 상세 보기`}
        onPress={onPress}
        style={({ pressed }) => [compact && styles.listPress, pressed && styles.pressed]}
      >
        {concert.posterUrl ? (
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel={`${concert.title} 포스터`}
            source={{ uri: concert.posterUrl }}
            style={[styles.poster, compact && styles.listPoster]}
          />
        ) : (
          <View style={[styles.posterFallback, compact && styles.listPoster]}>
            <Text style={styles.dateMonth}>
              {new Intl.DateTimeFormat('en-US', { month: 'short' })
                .format(new Date(concert.startsAt))
                .toUpperCase()}
            </Text>
            <Text style={styles.dateDay}>{new Date(concert.startsAt).getDate()}</Text>
          </View>
        )}

        <View style={[styles.content, compact && styles.listCopy]}>
          <View style={styles.artistRow}>
            <Text style={[styles.statusBadge, phase === '진행 중' ? styles.ongoingBadge : phase === '예정' ? styles.upcomingBadge : styles.completedBadge]}>{phase}</Text>
          </View>
          <Text numberOfLines={2} style={styles.title}>
            {concert.title}
          </Text>
          <Text numberOfLines={1} style={styles.meta}>
            {isKopis
              ? new Intl.DateTimeFormat('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                }).format(new Date(concert.startsAt))
              : dateFormatter.format(new Date(concert.startsAt))}
          </Text>
          <Text numberOfLines={1} style={styles.meta}>
            {concert.venue.name} · {concert.venue.city}
          </Text>
        </View>
      </Pressable>

      {onFavoriteToggle ? (
        <Pressable
          accessibilityLabel={favorite ? `${concert.title} 찜 해제` : `${concert.title} 찜하기`}
          accessibilityRole="button"
          accessibilityState={{ selected: Boolean(favorite) }}
          onPress={event => favoritePress(event, onFavoriteToggle)}
          style={[styles.favoriteButton, compact && styles.listFavorite]}
        >
          <View pointerEvents="none" style={styles.favoriteSurface}><Ionicons
            color={favorite ? colors.primary : colors.textMuted}
            name={favorite ? 'heart' : 'heart-outline'}
            size={20}
          /></View>
        </Pressable>
      ) : null}

    </View>
  );
}

const styles = StyleSheet.create({
  listCard: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  listPress: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  listPoster: { width: 78, height: 108, flexShrink: 0, borderRadius: radius.sm },
  listCopy: { flex: 1, minWidth: 0, paddingTop: 0, paddingRight: 52 },
  listFavorite: { top: 12, right: 0 },
  statusBadge: { borderRadius: 8, overflow: 'hidden', fontSize: 12, lineHeight: 18, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4 },
  completedBadge: { backgroundColor: colors.surfaceMuted, color: colors.textMuted },
  ongoingBadge: { backgroundColor: '#E7F4ED', color: colors.success },
  upcomingBadge: { backgroundColor: colors.primarySoft, color: colors.primary },
  card: {
    width: 196,
  },
  pressed: {
    opacity: 0.72,
  },
  favoriteButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    width: 44,
    zIndex: 1,
  },
  favoriteSurface: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' },
  posterFallback: {
    borderRadius: radius.md,
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
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    height: 264,
    width: '100%',
  },
  content: {
    gap: 3,
    paddingTop: 10,
  },
  artistRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  title: {
    height: 44,
    lineHeight: 22,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  meta: {
    lineHeight: 18,
    color: colors.textMuted,
    fontSize: typography.caption,
  },
});
