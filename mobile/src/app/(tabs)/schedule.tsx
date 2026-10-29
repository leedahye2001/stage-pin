import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTicketOpenings } from '@/api/concerts';
import { favoriteOpenings } from '@/lib/favorite-openings';
import { useFavorites } from '@/lib/favorites';
import { calendarDays, moveMonth, openingSchedule, scheduleLabels, schedulesForDay, seoulDay, type SavedSchedule, type ScheduleFilter } from '@/lib/saved-schedules';
import { useSavedSchedules } from '@/lib/saved-schedules-state';
import { colors } from '@/theme/tokens';

const dayFormat = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'short' });
const timeFormat = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false });
const filters: { label: string; value: ScheduleFilter }[] = [{ label: '전체', value: 'ALL' }, { label: '예매', value: 'TICKET' }, { label: '공연', value: 'SHOW' }];
const scheduleTones = {
  SHOW: { color: '#7045CE', backgroundColor: '#EEE7FD' },
  FAN_PRESALE: { color: '#B6386B', backgroundColor: '#FCE7EF' },
  GENERAL_SALE: { color: '#13776D', backgroundColor: '#DDF3EE' },
} satisfies Record<SavedSchedule['type'], { color: string; backgroundColor: string }>;
const scheduleTypes = Object.keys(scheduleTones) as SavedSchedule['type'][];

export default function ScheduleScreen() {
  const params = useLocalSearchParams<{ date?: string; selection?: string }>();
  const day = params.date;
  const valid = typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)
    && !Number.isNaN(Date.parse(`${day}T00:00:00+09:00`)) && seoulDay(`${day}T00:00:00+09:00`) === day;
  return <PersonalSchedule key={`${valid ? day : 'today'}:${params.selection ?? ''}`} initialDay={valid ? day : seoulDay(new Date())} />;
}

function PersonalSchedule({ initialDay }: { initialDay: string }) {
  const saved = useSavedSchedules();
  const { artists } = useFavorites();
  const today = seoulDay(new Date());
  const [selected, setSelected] = useState(initialDay);
  const [month, setMonth] = useState(initialDay.slice(0, 7));
  const [filter, setFilter] = useState<ScheduleFilter>('ALL');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const tickets = useQuery({ queryKey: ['ticket-openings'], queryFn: getTicketOpenings, enabled: artists.length > 0 });
  const jump = (day: string) => { setSelected(day); setMonth(day.slice(0, 7)); };
  const dayItems = schedulesForDay(saved.items, selected, filter);
  const filtered = saved.items.filter((item) => filter === 'ALL' || (filter === 'SHOW' ? item.type === 'SHOW' : item.type !== 'SHOW'));
  const marked = new Set(filtered.map((item) => seoulDay(item.startsAt)));
  const dayTypes = new Map<string, Set<SavedSchedule['type']>>();
  for (const item of filtered) {
    const day = seoulDay(item.startsAt);
    if (!dayTypes.has(day)) dayTypes.set(day, new Set());
    dayTypes.get(day)!.add(item.type);
  }
  const next = filtered.find((item) => seoulDay(item.startsAt) >= today);
  const recommendations = favoriteOpenings(tickets.data ?? [], artists).map(openingSchedule)
    .filter((item): item is SavedSchedule => item !== null && !saved.items.some((entry) => entry.id === item.id)).slice(0, 4);
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError('');
    try { await action(); }
    catch (exception) { setError(exception instanceof Error ? exception.message : '일정 변경에 실패했어요. 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  };
  const open = (url: string) => run(async () => { await Linking.openURL(url); });

  return <SafeAreaView edges={['top']} style={s.safe}><ScrollView contentContainerStyle={s.content}>
    <View style={s.header}><View><Text style={s.eyebrow}>MY STAGE, MY PLAN</Text><Text style={s.title}>내가 챙길 덕질 일정</Text></View><View style={s.headerIcon}><Ionicons name="calendar" size={25} color={colors.primary} /></View></View>
    <Text style={s.description}>공연을 발견하고, 필요한 날짜만 쏙 담아두세요.{ '\n' }아티스트 찜만으로 달력에 자동 추가되지는 않아요.</Text>
    <View style={s.summary}><View><Text style={s.summaryNumber}>{saved.items.length}<Text style={s.summaryUnit}>개의 내 일정</Text></Text><Text style={s.hint}>이 기기에 저장돼요 · 자동 예매·알림 아님</Text></View><Pressable accessibilityRole="button" onPress={() => router.push('/explore')} style={s.findButton}><Text style={s.link}>공연 찾기 ↗</Text></Pressable></View>
    {saved.loadError || error ? <Text accessibilityRole="alert" style={s.error}>{saved.loadError || error}</Text> : null}
    {!saved.ready && !saved.loadError ? <ActivityIndicator accessibilityLabel="내 일정 불러오는 중" color={colors.primary} /> : null}

    <View style={s.calendar}>
      <View style={s.between}><Text style={s.month}>{month.split('-')[0]}년 {Number(month.split('-')[1])}월</Text><View style={s.row}><Pressable accessibilityRole="button" accessibilityLabel="오늘 날짜 보기" onPress={() => jump(today)} style={s.todayButton}><Text style={s.link}>오늘</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="이전 달" onPress={() => jump(`${moveMonth(month, -1)}-01`)} style={s.arrow}><Ionicons name="chevron-back" size={19} color={colors.text} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="다음 달" onPress={() => jump(`${moveMonth(month, 1)}-01`)} style={s.arrow}><Ionicons name="chevron-forward" size={19} color={colors.text} /></Pressable></View></View>
      <View style={s.grid}>{['일', '월', '화', '수', '목', '금', '토'].map((day, index) => <View key={day} style={s.weekday}><Text style={[s.weekdayText, index === 0 && { color: '#CB718B' }, index === 6 && { color: '#7C7FC1' }]}>{day}</Text></View>)}</View>
      <View style={s.grid}>{calendarDays(month).map((day, index) => day ? <Pressable key={day} accessibilityRole="button" accessibilityLabel={`${day}${marked.has(day) ? ` ${scheduleTypes.filter((type) => dayTypes.get(day)?.has(type)).map((type) => scheduleLabels[type]).join(', ')} 일정 있음` : ''}`} accessibilityState={{ selected: day === selected }} onPress={() => { setSelected(day); setRemoving(null); }} style={s.cell}><View style={[s.dayCircle, day === today && s.todayCircle, day === selected && s.selectedDay]}><Text style={[s.dayText, day === today && { color: colors.primary }, day === selected && { color: '#FFFFFF' }]}>{Number(day.slice(-2))}</Text><View style={[s.dots, day === selected && marked.has(day) && s.selectedDots]}>{scheduleTypes.filter((type) => dayTypes.get(day)?.has(type)).map((type) => <View key={type} style={[s.dot, { backgroundColor: scheduleTones[type].color }]} />)}</View></View></Pressable> : <View key={`blank-${index}`} style={s.cell} />)}</View>
      <View style={s.legendRow}>{scheduleTypes.map((type) => <View key={type} style={s.legendItem}><View style={[s.dot, { backgroundColor: scheduleTones[type].color }]} /><Text style={s.legend}>{scheduleLabels[type]}</Text></View>)}<Text style={s.legend}>한국 시간 기준</Text></View>
    </View>

    <View style={s.row}>{filters.map((item) => <Pressable key={item.value} accessibilityRole="button" accessibilityLabel={`${item.label} 일정 필터`} accessibilityState={{ selected: filter === item.value }} onPress={() => setFilter(item.value)} style={[s.chip, filter === item.value && s.activeChip]}><Text style={[s.chipText, filter === item.value && { color: '#FFFFFF' }]}>{item.label}</Text></Pressable>)}</View>
    <View style={s.between}><Text style={s.sectionTitle}>{dayFormat.format(new Date(`${selected}T12:00:00+09:00`))}</Text><Text style={s.hint}>{dayItems.length}개 일정</Text></View>
    {dayItems.length ? dayItems.map((item) => <View key={item.id} style={[s.card, { borderLeftColor: scheduleTones[item.type].color, borderLeftWidth: 4 }]}>
      <View style={s.between}><Text style={[s.badge, scheduleTones[item.type]]}>{scheduleLabels[item.type]}</Text><Text style={s.time}>{item.dateOnly ? '시간·회차 확인 필요' : `${timeFormat.format(new Date(item.startsAt))} · KST`}</Text></View>
      <Text style={s.artist}>{item.artistName}</Text><Text style={s.cardTitle}>{item.title}</Text>
      <Text style={s.hint}>{item.type === 'SHOW' ? `${item.venueName ?? '공연장 미등록'}${item.endsAt ? ` · 기간 종료 ${seoulDay(item.endsAt)}` : ''}` : item.vendor}</Text>
      {item.dateOnly ? <Text style={s.hint}>공연 기간 시작일이에요. 실제 관람 회차는 공식 예매처에서 확인해 주세요.</Text> : <Text style={s.hint}>일정 저장 ≠ 예매 완료 · 예매는 외부 예매처에서 진행해요.</Text>}
      {item.type === 'SHOW' ? <Pressable disabled={busy} accessibilityRole="checkbox" accessibilityLabel={`${item.title} 관람 예정으로 표시`} accessibilityState={{ checked: item.attending }} onPress={() => run(() => saved.setAttending(item.id, !item.attending))} style={s.attending}><Ionicons name={item.attending ? 'checkmark-circle' : 'ellipse-outline'} size={21} color={colors.primary} /><Text style={s.link}>{item.attending ? '관람 예정 · 내가 표시했어요' : '관람 예정으로 표시'}</Text></Pressable> : null}
      <View style={[s.row, { flexWrap: 'wrap' }]}>
        {item.ticketUrl ? <Pressable disabled={busy} accessibilityRole="link" onPress={() => open(item.ticketUrl!)} style={s.primary}><Text style={s.primaryText}>{item.vendor ? `${item.vendor}로 이동 ↗` : '예매처로 이동 ↗'}</Text></Pressable> : null}
        {item.concertId ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/concerts/[id]', params: { id: item.concertId!, genre: item.genre } })} style={s.secondary}><Text style={s.link}>공연 상세</Text></Pressable> : null}
        <Pressable disabled={busy} accessibilityRole="link" onPress={() => open(item.sourceUrl)} style={s.secondary}><Text style={s.link}>출처 확인 ↗</Text></Pressable>
        <Pressable disabled={busy} accessibilityRole="button" accessibilityLabel={`${item.title} 일정에서 빼기`} onPress={() => setRemoving(removing === item.id ? null : item.id)} style={s.secondary}><Text style={s.muted}>빼기</Text></Pressable>
      </View>
      {removing === item.id ? <View style={s.confirm}><Text style={s.hint}>내 달력에서만 빼요. 공연 찜이나 실제 예매는 취소되지 않아요.</Text><View style={s.row}><Pressable disabled={busy} accessibilityRole="button" accessibilityLabel="일정 삭제 확인" onPress={() => run(async () => { await saved.remove(item.id); setRemoving(null); })} style={s.secondary}><Text style={s.error}>일정에서 빼기</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setRemoving(null)} style={s.secondary}><Text style={s.muted}>유지할게요</Text></Pressable></View></View> : null}
    </View>) : <View style={s.empty}><View style={s.emptyIcon}><Ionicons name="calendar-outline" size={31} color={colors.primary} /></View><Text style={s.emptyTitle}>{saved.items.length ? '이 날짜에는 담은 일정이 없어요' : '첫 번째 덕질 일정을 담아볼까요?'}</Text><Text style={s.emptyCopy}>공연 상세에서 ‘내 일정에 담기’를 선택하면{ '\n' }공연일과 확인된 예매일이 이곳에 모여요.</Text>{next ? <Pressable accessibilityRole="button" onPress={() => jump(seoulDay(next.startsAt))} style={s.primary}><Text style={s.primaryText}>다음 내 일정 · {seoulDay(next.startsAt).slice(5)} →</Text></Pressable> : <Pressable accessibilityRole="button" onPress={() => router.push('/explore')} style={s.primary}><Text style={s.primaryText}>담을 공연 찾아보기 →</Text></Pressable>}</View>}

    <View style={s.recommendations}><Text style={s.sectionTitle}>찜한 아티스트의 예매 일정</Text><Text style={s.hint}>추천만 보여드려요. 직접 담은 일정만 달력에 표시돼요.</Text>
      {!artists.length ? <Pressable accessibilityRole="button" onPress={() => router.push('/')} style={s.secondary}><Text style={s.link}>홈에서 내 최애를 찜해보세요 →</Text></Pressable> : tickets.isPending ? <ActivityIndicator color={colors.primary} /> : tickets.isError ? <Pressable accessibilityRole="button" onPress={() => tickets.refetch()} style={s.secondary}><Text style={s.link}>예매 일정 조회 실패 · 다시 시도</Text></Pressable> : recommendations.length ? recommendations.map((item) => <View key={item.id} style={s.recommend}><View style={{ flex: 1, gap: 5 }}><Text style={s.artist}>{item.artistName} · {scheduleLabels[item.type]}</Text><Text style={s.label}>{item.title}</Text><Text style={s.hint}>{seoulDay(item.startsAt)} {timeFormat.format(new Date(item.startsAt))} · {item.vendor}</Text></View><Pressable disabled={busy || !saved.ready} accessibilityRole="button" accessibilityLabel={`${item.title} ${scheduleLabels[item.type]} 담기`} onPress={() => run(async () => { await saved.save([item]); jump(seoulDay(item.startsAt)); setFilter('ALL'); })} style={s.findButton}><Text style={s.link}>＋ 담기</Text></Pressable></View>) : <Text style={s.hint}>확인된 새 예매 일정이 아직 없어요. 이미 담은 일정은 추천에서 제외돼요.</Text>}
    </View>
    <Text style={s.footer}>이 기기에만 저장돼요. 삭제·기기 변경 시 복원이나 계정 동기화는 지원하지 않아요.{ '\n' }현장 거래 일정은 실제 거래 확정 기능과 함께 연결할 예정이에요.</Text>
  </ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingBottom: 32, gap: 18, maxWidth: 700, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, eyebrow: { fontSize: 10, letterSpacing: 1.6, fontWeight: '900', color: colors.primary },
  title: { fontSize: 27, fontWeight: '900', color: colors.text, marginTop: 8, letterSpacing: -1 }, headerIcon: { backgroundColor: '#EDE7FF', width: 47, height: 47, borderRadius: 18, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  description: { color: colors.textMuted, fontSize: 12, lineHeight: 21 }, hint: { color: colors.textMuted, fontSize: 11, lineHeight: 19 },
  summary: { padding: 18, borderRadius: 20, backgroundColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  summaryNumber: { fontSize: 27, fontWeight: '900', color: colors.primary }, summaryUnit: { fontSize: 13, color: colors.text, fontWeight: '700' },
  findButton: { backgroundColor: '#FFFFFF', paddingHorizontal: 13, paddingVertical: 13, borderRadius: 14 }, link: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  calendar: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#EDE7F4' }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  month: { fontSize: 18, fontWeight: '900', color: colors.text }, todayButton: { padding: 12 }, arrow: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' }, weekday: { width: '14.285714%', alignItems: 'center', paddingTop: 15, paddingBottom: 6 }, weekdayText: { color: '#9990A5', fontSize: 11, fontWeight: '700' },
  cell: { width: '14.285714%', height: 49, alignItems: 'center', justifyContent: 'center' }, dayCircle: { width: 39, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 4 }, dayText: { fontSize: 13, color: colors.text, fontWeight: '700' }, todayCircle: { backgroundColor: '#F2EDFE' }, selectedDay: { backgroundColor: colors.primary },
  dot: { width: 5, height: 5, borderRadius: 3 }, dots: { flexDirection: 'row', gap: 3, minHeight: 5, paddingHorizontal: 3 }, selectedDots: { backgroundColor: '#FFFFFF', paddingVertical: 2, borderRadius: 6 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 12 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 }, legend: { color: '#756B83', fontSize: 10 },
  chip: { backgroundColor: colors.button, paddingVertical: 11, paddingHorizontal: 21, borderRadius: 24, borderWidth: 1, borderColor: colors.button }, activeChip: { backgroundColor: colors.buttonText, borderColor: colors.buttonText }, chipText: { fontSize: 12, fontWeight: '800', color: colors.textMuted },
  sectionTitle: { fontSize: 17, color: colors.text, fontWeight: '900' }, card: { backgroundColor: '#FFFFFF', padding: 18, gap: 11, borderRadius: 22, borderWidth: 1, borderColor: '#E8E0F1' },
  badge: { alignSelf: 'flex-start', fontWeight: '800', fontSize: 10, padding: 7, borderRadius: 8 }, time: { color: '#8C8199', fontSize: 10 }, artist: { color: colors.primary, fontSize: 11, fontWeight: '800' }, cardTitle: { color: colors.text, fontWeight: '900', fontSize: 17, lineHeight: 24 }, label: { color: colors.text, fontWeight: '700', fontSize: 12, lineHeight: 19 },
  attending: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 10 }, primary: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 13, alignItems: 'center' }, primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' }, secondary: { paddingVertical: 13, paddingHorizontal: 8 }, muted: { color: colors.textMuted, fontSize: 11 }, confirm: { backgroundColor: '#F8F4FA', padding: 12, borderRadius: 13, gap: 8 },
  empty: { backgroundColor: colors.surfaceMuted, padding: 24, borderRadius: 23, alignItems: 'center', gap: 14 }, emptyIcon: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 21, transform: [{ rotate: '-7deg' }] }, emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '800' }, emptyCopy: { color: colors.textMuted, fontSize: 11, lineHeight: 20, textAlign: 'center' },
  recommendations: { padding: 18, borderRadius: 23, backgroundColor: '#FFFFFF', gap: 13 }, recommend: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#F0EBF6', paddingTop: 13 }, footer: { color: '#9B91A8', fontSize: 10, lineHeight: 19 }, error: { color: '#B34058', fontSize: 12, lineHeight: 20 },
});
