import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { FlatList, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ScheduleType, TicketOpening, TicketVendor } from '@/api/concerts';
import { colors, radius, spacing } from '@/theme/tokens';

type TicketingCarouselProps = {
  openings: TicketOpening[];
  scheduleType: Extract<ScheduleType, 'FAN_PRESALE' | 'GENERAL_SALE'>;
  title: string;
};

type TicketVendorFilter = TicketVendor | 'ALL';

const vendorOptions: { id: TicketVendorFilter; label: string }[] = [
  { id: 'ALL', label: '전체' },
  { id: 'NOL', label: 'NOL' },
  { id: 'YES24', label: 'YES24' },
  { id: 'MELON', label: '멜론티켓' },
  { id: 'TICKETLINK', label: '티켓링크' },
  { id: 'OTHER', label: '기타' },
];

const vendorLabel: Record<TicketVendor, string> = {
  NOL: 'NOL',
  YES24: 'YES24',
  MELON: '멜론티켓',
  TICKETLINK: '티켓링크',
  OTHER: '공식 예매처',
};

const countdownLabel = (startsAt: string) => {
  const difference = new Date(startsAt).getTime() - Date.now();
  const days = Math.ceil(difference / (1000 * 60 * 60 * 24));
  if (days <= 0) return '오늘 오픈';
  return `D-${days}`;
};

const scheduleLabel = (opening: TicketOpening) => {
  const date = new Date(opening.opensAt);
  const dateLabel = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: opening.timezone,
  }).format(date);
  const timeLabel = new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: opening.timezone,
  }).format(date);
  return `${dateLabel} ${timeLabel}`;
};

export function TicketingCarousel({ openings, scheduleType, title }: TicketingCarouselProps) {
  const [selectedVendor, setSelectedVendor] = useState<TicketVendorFilter>('ALL');
  const [renderedAt] = useState(Date.now);
  const items = useMemo(() => {
    return openings
      .filter((opening) => opening.type === scheduleType && new Date(opening.opensAt).getTime() >= renderedAt)
      .sort((left, right) => new Date(left.opensAt).getTime() - new Date(right.opensAt).getTime());
  }, [openings, renderedAt, scheduleType]);
  const filteredItems = items
    .filter((item) => selectedVendor === 'ALL' || item.vendor === selectedVendor)
    .slice(0, 10);
  const selectedVendorLabel = vendorOptions.find((option) => option.id === selectedVendor)?.label;

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View>
          <Text style={styles.eyebrow}>{scheduleType === 'FAN_PRESALE' ? 'PRESALE' : 'GENERAL SALE'}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        {items.length ? <Text style={styles.count}>{items.length}</Text> : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.vendorFilters}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {vendorOptions.map((option) => {
          const selected = option.id === selectedVendor;
          const count = option.id === 'ALL'
            ? items.length
            : items.filter((item) => item.vendor === option.id).length;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={option.id}
              onPress={() => setSelectedVendor(option.id)}
              style={[styles.vendorFilter, selected && styles.vendorFilterSelected]}
            >
              <Text style={[styles.vendorFilterText, selected && styles.vendorFilterTextSelected]}>
                {option.label}{count ? ` ${count}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {filteredItems.length ? (
        <FlatList
          contentContainerStyle={styles.list}
          data={filteredItems}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TicketingCard item={item} />}
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons color={colors.primary} name="notifications-outline" size={20} />
          </View>
          <View style={styles.emptyContent}>
            <Text style={styles.emptyTitle}>
              {items.length ? `${selectedVendorLabel}의 예정 일정이 없어요.` : '아직 확인된 일정이 없어요.'}
            </Text>
            <Text style={styles.emptyDescription}>
              공식 공지와 예매처 링크가 확인된 일정만 오픈 임박순으로 보여드릴게요.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function TicketingCard({ item }: { item: TicketOpening }) {
  const vendor = vendorLabel[item.vendor];

  return (
    <Pressable
      accessibilityLabel={`${item.concertTitle} ${vendor} 예매 페이지 열기`}
      accessibilityRole="link"
      onPress={() => Linking.openURL(item.ticketUrl)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardTop}>
        {item.posterUrl ? (
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: item.posterUrl }}
            style={styles.poster}
          />
        ) : (
          <View style={styles.posterFallback}>
            <Ionicons color={colors.primary} name="ticket-outline" size={24} />
          </View>
        )}
        <View style={styles.cardContent}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{countdownLabel(item.opensAt)}</Text>
          </View>
          <Text numberOfLines={1} style={styles.artist}>{item.artistName}</Text>
          <Text numberOfLines={2} style={styles.concertTitle}>{item.concertTitle}</Text>
          <Text style={styles.date}>{scheduleLabel(item)}</Text>
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
  vendorFilters: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  vendorFilter: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  vendorFilterSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  vendorFilterText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  vendorFilterTextSelected: {
    color: colors.surface,
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
  artist: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  concertTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
    marginTop: 2,
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
