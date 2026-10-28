import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DemoNotice } from '@/components/GoodsDemo';

import { colors, radius, spacing, typography } from '@/theme/tokens';

type ScheduleKind = 'PRESALE' | 'SALE' | 'SHOW';

const filters: { label: string; value: ScheduleKind | 'ALL' }[] = [
  { label: '전체', value: 'ALL' },
  { label: '예매', value: 'SALE' },
  { label: '공연', value: 'SHOW' },
];

const days = [
  { day: '월', date: 2 },
  { day: '화', date: 3 },
  { day: '수', date: 4 },
  { day: '목', date: 5 },
  { day: '금', date: 6, today: true },
  { day: '토', date: 7 },
  { day: '일', date: 8 },
];

const schedules = [
  {
    id: 'schedule-1',
    kind: 'PRESALE' as const,
    date: '11.06',
    weekday: '금',
    time: '20:00',
    label: '팬클럽 선예매',
    title: 'SEVENTEEN FAN DAY · 가상 팬콘',
    detail: 'NOL 티켓 예시 · 실제 예매 일정 아님',
  },
  {
    id: 'schedule-2',
    kind: 'SALE' as const,
    date: '11.09',
    weekday: '월',
    time: '19:00',
    label: '일반 예매',
    title: 'IVE FAN DAY · 가상 팬미팅',
    detail: 'YES24 티켓 예시 · 실제 예매 일정 아님',
  },
  {
    id: 'schedule-3',
    kind: 'SHOW' as const,
    date: '11.14',
    weekday: '토',
    time: '18:00',
    label: '공연',
    title: 'SEVENTEEN 가상 팬콘',
    detail: 'KSPO DOME · 가상 공연장 설정',
  },
  {
    id: 'schedule-4',
    kind: 'SHOW' as const,
    date: '11.21',
    weekday: '토',
    time: '17:00',
    label: '공연',
    title: 'IVE 가상 팬미팅',
    detail: '인스파이어 아레나 · 가상 공연장 설정',
  },
];

export default function ScheduleScreen() {
  const [filter, setFilter] = useState<ScheduleKind | 'ALL'>('ALL');
  const visibleSchedules = schedules.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'SALE') return item.kind === 'SALE' || item.kind === 'PRESALE';
    return item.kind === filter;
  });

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>MY SCHEDULE</Text>
            <Text style={styles.title}>놓치면 안 되는 일정</Text>
          </View>
          <View style={styles.notificationButton}>
            <Ionicons color={colors.primary} name="notifications" size={22} />
            <View style={styles.notificationDot} />
          </View>
        </View>

        <DemoNotice />

        <View style={styles.calendarCard}>
          <View style={styles.monthRow}>
            <Ionicons color={colors.textMuted} name="calendar-outline" size={20} />
            <Text style={styles.month}>2026년 11월 · 샘플 달력</Text>
            <Text style={styles.previewText}>미리보기</Text>
          </View>
          <View style={styles.weekRow}>
            {days.map((item) => (
              <View key={item.date} style={[styles.dayCell, item.today && styles.todayCell]}>
                <Text style={[styles.dayName, item.today && styles.todayText]}>{item.day}</Text>
                <Text style={[styles.dayNumber, item.today && styles.todayText]}>{item.date}</Text>
                {item.today ? <View style={styles.todayDot} /> : null}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.filterRow}>
          {filters.map((item) => {
            const selected = filter === item.value;
            return (
              <Pressable
                accessibilityState={{ selected }}
                key={item.value}
                onPress={() => setFilter(item.value)}
                style={[styles.filterChip, selected && styles.filterChipSelected]}
              >
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>다가오는 일정</Text>
          <Text style={styles.count}>{visibleSchedules.length}</Text>
        </View>

        <View style={styles.timeline}>
          {visibleSchedules.map((item, index) => (
            <View key={item.id} style={styles.scheduleRow}>
              <View style={styles.dateColumn}>
                <Text style={styles.scheduleDate}>{item.date}</Text>
                <Text style={styles.scheduleWeekday}>{item.weekday}</Text>
              </View>
              <View style={styles.railColumn}>
                <View style={[styles.timelineDot, item.kind === 'SHOW' && styles.showDot]} />
                {index < visibleSchedules.length - 1 ? <View style={styles.timelineLine} /> : null}
              </View>
              <View style={styles.scheduleCard}>
                <View style={styles.scheduleTopRow}>
                  <View style={[styles.kindBadge, item.kind === 'SHOW' && styles.showBadge]}>
                    <Text style={[styles.kindText, item.kind === 'SHOW' && styles.showKindText]}>{item.label}</Text>
                  </View>
                  <Text style={styles.scheduleTime}>{item.time}</Text>
                </View>
                <Text style={styles.scheduleTitle}>{item.title}</Text>
                <Text style={styles.scheduleDetail}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.lg, padding: spacing.md, paddingBottom: spacing.xl },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8, marginTop: spacing.xs },
  notificationButton: {
    alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.pill,
    height: 46, justifyContent: 'center', position: 'relative', width: 46,
  },
  notificationDot: {
    backgroundColor: '#FF5A79', borderColor: colors.surface, borderRadius: radius.pill,
    borderWidth: 2, height: 10, position: 'absolute', right: 9, top: 8, width: 10,
  },
  previewNotice: {
    alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.md,
    flexDirection: 'row', gap: spacing.sm, padding: spacing.md,
  },
  previewText: { color: colors.primary, flex: 1, fontSize: 12, fontWeight: '700' },
  calendarCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
  monthRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  month: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  dayCell: { alignItems: 'center', borderRadius: radius.pill, gap: 5, paddingVertical: 9, width: 39 },
  todayCell: { backgroundColor: colors.primary },
  dayName: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  dayNumber: { color: colors.text, fontSize: 14, fontWeight: '900' },
  todayText: { color: colors.white },
  todayDot: { backgroundColor: colors.white, borderRadius: radius.pill, height: 3, width: 3 },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  filterChip: {
    backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill,
    borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 9,
  },
  filterChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  filterTextSelected: { color: colors.white },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: typography.title, fontWeight: '900' },
  count: {
    backgroundColor: colors.primarySoft, borderRadius: radius.pill, color: colors.primary,
    fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4,
  },
  timeline: { gap: 0 },
  scheduleRow: { flexDirection: 'row', minHeight: 128 },
  dateColumn: { alignItems: 'center', paddingTop: 5, width: 46 },
  scheduleDate: { color: colors.text, fontSize: 14, fontWeight: '900' },
  scheduleWeekday: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  railColumn: { alignItems: 'center', marginHorizontal: spacing.sm, width: 12 },
  timelineDot: { backgroundColor: '#FF86A0', borderRadius: radius.pill, height: 12, marginTop: 8, width: 12 },
  showDot: { backgroundColor: colors.primary },
  timelineLine: { backgroundColor: colors.border, flex: 1, marginVertical: 5, width: 2 },
  scheduleCard: {
    backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md,
    borderWidth: 1, flex: 1, marginBottom: spacing.md, padding: spacing.md,
  },
  scheduleTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  kindBadge: { backgroundColor: '#FFE7ED', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  showBadge: { backgroundColor: colors.primarySoft },
  kindText: { color: '#D94B70', fontSize: 10, fontWeight: '900' },
  showKindText: { color: colors.primary },
  scheduleTime: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  scheduleTitle: { color: colors.text, fontSize: 15, fontWeight: '900', lineHeight: 20, marginTop: spacing.sm },
  scheduleDetail: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
});
