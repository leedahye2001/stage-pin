import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getTicketOpenings, type Concert } from '@/api/concerts';
import { concertScheduleOptions, scheduleLabels, seoulDay } from '@/lib/saved-schedules';
import { useSavedSchedules } from '@/lib/saved-schedules-state';
import { colors } from '@/theme/tokens';

const ticketDate = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
function openCalendar(day: string) {
  router.push({ pathname: '/schedule', params: { date: day, selection: String(Date.now()) } });
}

export function ConcertSchedulePicker({ concert }: { concert: Concert }) {
  const saved = useSavedSchedules();
  const tickets = useQuery({ queryKey: ['ticket-openings'], queryFn: getTicketOpenings });
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const options = concertScheduleOptions(concert, tickets.data ?? []);
  const additions = options.filter((item) => selected.includes(item.id) && !saved.items.some((entry) => entry.id === item.id));
  const existing = options.filter((item) => saved.items.some((entry) => entry.id === item.id));
  const save = async () => {
    setBusy(true); setError('');
    try {
      await saved.save(additions);
      setSelected([]);
      openCalendar(seoulDay(additions[0].startsAt));
    } catch (exception) { setError(exception instanceof Error ? exception.message : '일정을 저장하지 못했어요. 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  };
  if (!options.length) return null;
  return <View style={s.card}>
    <View style={s.heading}><Ionicons name="calendar-outline" size={24} color={colors.primary} /><View style={{ flex: 1 }}><Text style={s.title}>내 일정에 담기</Text><Text style={s.hint}>챙길 날짜만 골라 내 달력에 모아두세요.</Text></View></View>
    {options.map((item) => {
      const stored = existing.some((entry) => entry.id === item.id);
      const checked = stored || selected.includes(item.id);
      return <Pressable key={item.id} accessibilityRole="checkbox" accessibilityLabel={`${scheduleLabels[item.type]} 일정 선택`} accessibilityState={{ checked, disabled: stored || busy || !saved.ready }} disabled={stored || busy || !saved.ready} onPress={() => setSelected((current) => checked ? current.filter((id) => id !== item.id) : [...current, item.id])} style={[s.option, checked && s.selected]}>
        <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={23} color={colors.primary} />
        <View style={{ flex: 1, gap: 5 }}><Text style={s.label}>{item.type === 'SHOW' ? '공연 기간 시작일' : scheduleLabels[item.type]}{stored ? ' · 담았어요' : ''}</Text><Text style={s.date}>{item.dateOnly ? seoulDay(item.startsAt) : ticketDate.format(new Date(item.startsAt))}{item.vendor ? ` · ${item.vendor}` : ''}</Text></View>
      </Pressable>;
    })}
    <Text style={s.hint}>KOPIS 공연은 기간 시작일을 담아요. 종료일: {concert.endsAt ? seoulDay(concert.endsAt) : '미등록'}.{ '\n' }정확한 관람일·회차·시간은 공식 예매처에서 확인해 주세요.</Text>
    {tickets.isPending ? <Text style={s.hint}>확인된 예매 일정을 불러오고 있어요…</Text> : tickets.isError ? <Pressable accessibilityRole="button" onPress={() => tickets.refetch()}><Text style={s.link}>예매 일정 조회 실패 · 다시 불러오기</Text></Pressable> : options.length === 1 ? <Text style={s.hint}>이 공연과 연결된 확인된 선예매·일반예매 일정은 아직 없어요. 날짜를 추정해서 추가하지 않아요.</Text> : null}
    <Text style={s.notice}>일정 저장은 티켓 예매가 아니에요. 실제 예매는 예매처에서 진행해 주세요.</Text>
    {saved.loadError || error ? <Text accessibilityRole="alert" style={s.error}>{saved.loadError || error}</Text> : null}
    <Pressable accessibilityRole="button" accessibilityLabel="선택한 일정 담기" disabled={!saved.ready || busy || !additions.length} onPress={save} style={[s.button, (!saved.ready || busy || !additions.length) && { opacity: 0.45 }]}><Text style={s.buttonText}>{busy ? '저장 중…' : `선택한 일정 ${additions.length}개 담기`}</Text></Pressable>
    {existing.length ? <Pressable accessibilityRole="button" onPress={() => openCalendar(seoulDay(existing[0].startsAt))} style={{ padding: 10, alignItems: 'center' }}><Text style={s.link}>담은 일정 보기 →</Text></Pressable> : null}
  </View>;
}

const s = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 22, borderWidth: 1, borderColor: '#E1D7F8', marginTop: 24, gap: 13 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  hint: { color: colors.textMuted, fontSize: 11, lineHeight: 19 }, label: { fontSize: 13, color: colors.text, fontWeight: '800' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: 15, backgroundColor: '#F8F7FB', borderWidth: 1, borderColor: '#EAE5F2', minHeight: 68 },
  selected: { backgroundColor: '#F1ECFF', borderColor: '#B8A4EE' }, date: { color: colors.textMuted, fontSize: 12 },
  notice: { fontSize: 11, color: '#756589', lineHeight: 19 }, error: { color: '#B34058', fontSize: 12 },
  button: { backgroundColor: colors.primary, padding: 15, alignItems: 'center', borderRadius: 15 }, buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  link: { color: colors.primary, fontSize: 12, fontWeight: '700' },
});
