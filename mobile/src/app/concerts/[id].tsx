import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getConcert, type ConcertGenre, type FanCategory, type ScheduleType } from '@/api/concerts';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const scheduleLabels: Record<ScheduleType, string> = {
  FAN_VERIFICATION_OPEN: '팬클럽 인증 시작',
  FAN_VERIFICATION_CLOSE: '팬클럽 인증 마감',
  FAN_PRESALE: '팬클럽 선예매',
  GENERAL_SALE: '일반 예매',
  ADDITIONAL_SALE: '추가 판매',
  MERCH_SALE: 'MD 판매',
  DOOR_OPEN: '입장 시작',
  SHOW: '공연 시작',
};

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
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export default function ConcertDetailScreen() {
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
  const concertDate = isKopis
    ? new Intl.DateTimeFormat('ko-KR', {
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
      <Text style={styles.artist}>{artistNames}</Text>
      <Text style={styles.title}>{concert.title}</Text>
      <Text style={styles.date}>{concertDate}</Text>
      {isKopis ? (
        <Text style={styles.sourceBadge}>
          KOPIS · {genreLabels[concert.genre]} · {fanCategoryLabels[concert.fanCategory]}
        </Text>
      ) : null}

      <View style={styles.venueCard}>
        <Text style={styles.cardLabel}>VENUE</Text>
        <Text style={styles.venueName}>{concert.venue.name}</Text>
        <Text style={styles.meta}>
          {concert.venue.city}
          {concert.venue.countryCode ? `, ${concert.venue.countryCode}` : ''}
        </Text>
        {concert.venue.address ? <Text style={styles.meta}>{concert.venue.address}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>티켓팅 타임라인</Text>
      {concert.schedules.length ? (
        <View style={styles.timeline}>
          {concert.schedules.map((schedule, index) => (
          <View key={schedule.id} style={styles.timelineRow}>
            <View style={styles.timelineRail}>
              <View style={styles.timelineDot} />
              {index < concert.schedules.length - 1 ? <View style={styles.timelineLine} /> : null}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.scheduleLabel}>{scheduleLabels[schedule.type]}</Text>
              <Text style={styles.scheduleDate}>{dateFormatter.format(new Date(schedule.startsAt))}</Text>
              <Text style={styles.timezone}>{schedule.timezone}</Text>
            </View>
          </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptySchedule}>
          <Text style={styles.emptyScheduleTitle}>예매 일정은 공식 공지에서 확인해 주세요.</Text>
          <Text style={styles.emptyScheduleDescription}>
            선예매·일반예매 일정은 추후 공식 공지와 예매처에서 연동할 예정이에요.
          </Text>
        </View>
      )}

      <Pressable
        accessibilityRole="link"
        onPress={() => Linking.openURL(concert.officialUrl)}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
      >
        <Text style={styles.primaryButtonLabel}>{isKopis ? 'KOPIS 공연 상세' : '공식 공지 확인'}</Text>
      </Pressable>
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
    fontSize: typography.body,
    fontWeight: '800',
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
  sectionTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  timeline: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
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
  timelineRow: {
    flexDirection: 'row',
    minHeight: 88,
  },
  timelineRail: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 18,
  },
  timelineDot: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 12,
    marginTop: 4,
    width: 12,
  },
  timelineLine: {
    backgroundColor: colors.primarySoft,
    flex: 1,
    marginVertical: 4,
    width: 2,
  },
  timelineContent: {
    flex: 1,
  },
  scheduleLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  scheduleDate: {
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  timezone: {
    color: colors.primary,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
    padding: spacing.md,
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
