import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getConcert, type ConcertGenre, type FanCategory } from '@/api/concerts';
import { ConcertSchedulePicker } from '@/components/ConcertSchedulePicker';
import { VenueMap } from '@/components/VenueMap';
import { useFavorites } from '@/lib/favorites';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const genreLabels: Record<ConcertGenre, string> = {
  POPULAR_MUSIC: '대중음악',
  MUSICAL: '뮤지컬',
  PLAY: '연극',
  CLASSICAL: '클래식',
};

const fanCategoryLabels: Record<FanCategory, string> = {
  IDOL: '아이돌',
  SOLO: '솔로',
  BAND: '밴드',
  OTHER: '기타',
};

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const ticketVendor = (url: string) => {
  const normalized = url.toLowerCase();
  if (normalized.includes('yes24')) return 'YES24';
  if (normalized.includes('nol.yanolja') || normalized.includes('interpark')) return 'NOL 티켓';
  if (normalized.includes('ticketlink')) return '티켓링크';
  if (normalized.includes('melon')) return '멜론티켓';
  return '공식 예매처';
};

export default function ConcertDetailScreen() {
  const { isConcertFavorite, toggleConcert } = useFavorites();
  const { id, genre = 'POPULAR_MUSIC' } = useLocalSearchParams<{ id: string; genre: ConcertGenre }>();
  const concertQuery = useQuery({
    queryKey: ['concert', id, genre],
    queryFn: () => getConcert(id, genre),
    enabled: Boolean(id),
  });

  if (concertQuery.isPending) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (concertQuery.isError) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>공연 상세 정보를 불러오지 못했어요.</Text>
      </SafeAreaView>
    );
  }

  const concert = concertQuery.data;
  const artistNames = concert.artists.map((artist) => artist.name).join(', ') || '출연진 미등록';
  const isKopis = concert.source === 'KOPIS';
  const ticketLinks = concert.ticketLinks?.length
    ? concert.ticketLinks
    : concert.schedules.map((schedule) => ({
        name: ticketVendor(schedule.sourceUrl),
        url: schedule.sourceUrl,
      }));
  const concertDate = isKopis
    ? new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      }).format(new Date(concert.startsAt))
    : dateFormatter.format(new Date(concert.startsAt));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {concert.posterUrl ? (
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel={`${concert.title} 포스터`}
          resizeMode="cover"
          source={{ uri: concert.posterUrl }}
          style={styles.poster}
        />
      ) : null}
      <View style={styles.titleRow}>
        <Text style={styles.artist}>{artistNames}</Text>
        <Pressable
          accessibilityLabel={isConcertFavorite(concert.id) ? '공연 찜 해제' : '공연 찜하기'}
          accessibilityRole="button"
          onPress={() => toggleConcert(concert)}
          style={styles.favoriteButton}
        >
          <Ionicons
            color={colors.primary}
            name={isConcertFavorite(concert.id) ? 'heart' : 'heart-outline'}
            size={24}
          />
        </Pressable>
      </View>
      <Text style={styles.title}>{concert.title}</Text>
      <Text style={styles.date}>{concertDate}</Text>
      {isKopis ? (
        <Text style={styles.sourceBadge}>
          KOPIS · {genreLabels[concert.genre]} · {fanCategoryLabels[concert.fanCategory]}
        </Text>
      ) : null}

      <ConcertSchedulePicker key={concert.id} concert={concert} />

      <View style={styles.venueCard}>
        <Text style={styles.cardLabel}>공연장</Text>
        <Text style={styles.venueName}>{concert.venue.name}</Text>
        <Text style={styles.meta}>
          {concert.venue.city}
          {concert.venue.countryCode ? `, ${concert.venue.countryCode}` : ''}
        </Text>
        {concert.venue.address ? (
          <View style={styles.addressRow}>
            <Ionicons color={colors.primary} name="location" size={16} />
            <Text style={styles.address}>{concert.venue.address}</Text>
          </View>
        ) : null}
        <VenueMap venue={concert.venue} />
      </View>

      <Text style={styles.sectionTitle}>예매처</Text>
      {ticketLinks.length ? (
        <View style={styles.ticketLinks}>
          {ticketLinks.map((link) => (
            <Pressable
              accessibilityLabel={`${link.name} 예매 페이지 열기`}
              accessibilityRole="link"
              key={link.url}
              onPress={() => Linking.openURL(link.url)}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Ionicons color={colors.white} name="ticket" size={18} />
              <Text style={styles.primaryButtonLabel}>{link.name}에서 예매하기</Text>
              <Ionicons color={colors.white} name="arrow-forward" size={17} />
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.emptySchedule}>
          <Text style={styles.emptyScheduleTitle}>등록된 공식 예매처가 없어요.</Text>
          <Text style={styles.emptyScheduleDescription}>
            KOPIS에 공식 예매 링크가 등록되면 이곳에 바로 표시할게요.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  artist: {
    color: colors.primary,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '800',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  favoriteButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  poster: {
    alignSelf: 'center',
    aspectRatio: 2 / 3,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    width: '62%',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 35,
    marginTop: spacing.xs,
  },
  date: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginTop: spacing.sm,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    marginTop: spacing.sm,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  venueCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  cardLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  venueName: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  meta: {
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  addressRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.sm,
  },
  address: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  emptySchedule: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  emptyScheduleTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  emptyScheduleDescription: {
    color: colors.textMuted,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.md,
  },
  ticketLinks: {
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.76,
  },
  primaryButtonLabel: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '800',
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorText: {
    color: colors.text,
    fontSize: typography.body,
    textAlign: 'center',
  },
});
