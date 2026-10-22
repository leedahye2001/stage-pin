import Ionicons from '@expo/vector-icons/Ionicons';
import { FlatList, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Concert, ConcertSchedule, ScheduleType } from '@/api/concerts';
import { colors, radius, spacing } from '@/theme/tokens';

type TicketingCarouselProps = {
  concerts: Concert[];
  scheduleType: Extract<ScheduleType, 'FAN_PRESALE' | 'GENERAL_SALE'>;
  title: string;
};

type TicketingItem = {
  concert: Concert;
  schedule: ConcertSchedule;
};

const vendorName = (url: string) => {
  let hostname = '';
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return '공식 예매처';
  }
  if (hostname.includes('yes24')) return 'YES24';
  if (hostname.includes('nol.yanolja')) return 'NOL 티켓';
  if (hostname.includes('interpark')) return '인터파크 티켓';
  if (hostname.includes('melon')) return '멜론티켓';
  if (hostname.includes('ticketlink')) return '티켓링크';
  return '공식 예매처';
};

const countdownLabel = (startsAt: string) => {
  const difference = new Date(startsAt).getTime() - Date.now();
  const days = Math.ceil(difference / (1000 * 60 * 60 * 24));
  if (days <= 0) return '오늘 오픈';
  return `D-${days}`;
};

const scheduleLabel = (schedule: ConcertSchedule) => {
  const date = new Date(schedule.startsAt);
  const dateLabel = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: schedule.timezone,
  }).format(date);
  const timeLabel = new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: schedule.timezone,
  }).format(date);
  return `${dateLabel} ${timeLabel}`;
};

export function TicketingCarousel({ concerts, scheduleType, title }: TicketingCarouselProps) {
  const items = concerts
    .flatMap((concert) => concert.schedules
      .filter((schedule) => schedule.type === scheduleType && new Date(schedule.startsAt).getTime() >= Date.now())
      .map((schedule) => ({ concert, schedule })))
    .sort((left, right) => left.schedule.startsAt.localeCompare(right.schedule.startsAt))
    .slice(0, 10);

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View>
          <Text style={styles.eyebrow}>{scheduleType === 'FAN_PRESALE' ? 'PRESALE' : 'GENERAL SALE'}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        {items.length ? <Text style={styles.count}>{items.length}</Text> : null}
      </View>

      {items.length ? (
        <FlatList
          contentContainerStyle={styles.list}
          data={items}
          horizontal
          keyExtractor={(item) => item.schedule.id}
          renderItem={({ item }) => <TicketingCard item={item} />}
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons color={colors.primary} name="notifications-outline" size={20} />
          </View>
          <View style={styles.emptyContent}>
            <Text style={styles.emptyTitle}>아직 확인된 일정이 없어요.</Text>
            <Text style={styles.emptyDescription}>공식 공지와 예매처 링크가 확인된 일정만 보여드릴게요.</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function TicketingCard({ item }: { item: TicketingItem }) {
  const vendor = vendorName(item.schedule.sourceUrl);

  return (
    <Pressable
      accessibilityLabel={`${item.concert.title} ${vendor} 예매 페이지 열기`}
      accessibilityRole="link"
      onPress={() => Linking.openURL(item.schedule.sourceUrl)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardTop}>
        {item.concert.posterUrl ? (
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: item.concert.posterUrl }}
            style={styles.poster}
          />
        ) : (
          <View style={styles.posterFallback}>
            <Ionicons color={colors.primary} name="ticket-outline" size={24} />
          </View>
        )}
        <View style={styles.cardContent}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{countdownLabel(item.schedule.startsAt)}</Text>
          </View>
          <Text numberOfLines={2} style={styles.concertTitle}>{item.concert.title}</Text>
          <Text style={styles.date}>{scheduleLabel(item.schedule)}</Text>
        </View>
      </View>
      <View style={styles.vendorRow}>
        <Text style={styles.vendor}>{vendor}에서 예매</Text>
        <Ionicons color={colors.primary} name="arrow-forward" size={15} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  heading: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 3,
  },
  count: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    width: 286,
  },
  cardPressed: {
    opacity: 0.82,
  },
  cardTop: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  poster: {
    borderRadius: radius.sm,
    height: 88,
    width: 64,
  },
  posterFallback: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    height: 88,
    justifyContent: 'center',
    width: 64,
  },
  cardContent: {
    alignItems: 'flex-start',
    flex: 1,
  },
  badge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  concertTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },
  vendorRow: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  vendor: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  emptyContent: {
    flex: 1,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  emptyDescription: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
});
