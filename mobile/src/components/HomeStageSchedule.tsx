import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueries, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getConcerts, getTicketOpenings } from '@/api/concerts';
import { ConcertCard } from '@/components/ConcertCard';
import { TicketingCarousel } from '@/components/TicketingCarousel';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { marketStyles as m } from '@/components/GoodsDemo';
import { useFavorites } from '@/lib/favorites';
import { favoriteOpenings } from '@/lib/favorite-openings';
import { artistConcertKeywords, homeConcerts } from '@/lib/home-concerts';
import { colors } from '@/theme/tokens';

const tabs = [{ id: 'SHOW', label: '전체 공연' }, { id: 'FAN_PRESALE', label: '선예매' }, { id: 'GENERAL_SALE', label: '일반예매' }] as const;

export function HomeStageSchedule({ showAll = false }: { showAll?: boolean }) {
  const [tab, setTab] = useState<typeof tabs[number]['id']>('SHOW');
  const [now] = useState(Date.now);
  const { artists, isConcertFavorite, toggleConcert } = useFavorites();
  const queries = useQueries({ queries: artistConcertKeywords(artists).map(keyword => ({
    queryKey: ['concerts', 'POPULAR_MUSIC', 'following', keyword],
    queryFn: () => getConcerts('POPULAR_MUSIC', keyword),
    enabled: tab === 'SHOW', retry: false, staleTime: 300_000,
  })) });
  const openings = useQuery({ queryKey: ['ticket-openings'], queryFn: getTicketOpenings, enabled: artists.length > 0 && tab !== 'SHOW', retry: false });
  const shows = homeConcerts(queries.flatMap(query => query.data ?? []), artists, now);
  const tickets = favoriteOpenings(openings.data ?? [], artists);
  const pending = tab === 'SHOW' ? queries.some(query => query.isPending) : openings.isPending;
  const failed = tab === 'SHOW' ? queries.some(query => query.isError) : openings.isError;
  const retry = () => { if (tab === 'SHOW') queries.filter(query => query.isError).forEach(query => query.refetch()); else void openings.refetch(); };
  const cards = (showAll ? shows : shows.slice(0, 8)).map(concert => <ConcertCard key={concert.id} concert={concert} favorite={isConcertFavorite(concert.id)} onFavoriteToggle={() => toggleConcert(concert)} onPress={() => router.push({ pathname: '/concerts/[id]', params: { id: concert.id, genre: 'POPULAR_MUSIC' } })} />);
  return <View style={s.section}>
    <View style={m.between}><Text style={[m.sectionTitle, { flex: 1 }]}>좋아하는 아티스트의 공연 일정</Text>{!showAll ? <Pressable accessibilityRole="button" accessibilityLabel="좋아하는 아티스트의 공연 일정 전체 보기" onPress={() => router.push('/following-concerts')}><Text style={m.sectionLink}>{'전체 보기 >'}</Text></Pressable> : null}</View>
    <View style={m.row}>{tabs.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.label} 일정 보기`} accessibilityState={{ selected: tab === item.id }} onPress={() => setTab(item.id)} style={[m.chip, tab === item.id && m.chipSelected]}><Text style={[m.chipText, tab === item.id && m.chipSelectedText]}>{item.label}</Text></Pressable>)}</View>
    {!artists.length ? <View style={s.empty}><Text style={s.emptyTitle}>좋아하는 아티스트를 찜해보세요</Text><Text style={m.subtitle}>상단 검색에서 아티스트를 검색하고 하트를 누르면 공연이 표시돼요.</Text></View>
      : pending && (tab !== 'SHOW' || !shows.length) ? <LoadingSkeleton kind={tab === 'SHOW' ? 'concerts' : 'schedule'} label="좋아하는 아티스트의 일정 불러오는 중" />
      : failed && (tab !== 'SHOW' || !shows.length) ? <View style={s.empty}><Text style={m.subtitle}>일정을 불러오지 못했어요.</Text><Pressable accessibilityRole="button" onPress={retry}><Text style={m.sectionLink}>다시 불러오기</Text></Pressable></View>
      : tab === 'SHOW' ? shows.length ? showAll ? <View style={s.grid}>{cards}</View> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>{cards}</ScrollView>
        : <View style={s.empty}><Ionicons name="calendar-outline" size={25} color={colors.textMuted} /><Text style={s.emptyTitle}>찜한 아티스트의 확인된 공연이 없어요</Text></View>
      : <TicketingCarousel openings={tickets} scheduleType={tab} title={tab === 'FAN_PRESALE' ? '선예매 일정' : '일반예매 일정'} compact />}
    {artists.length > 0 && tab === 'SHOW' && shows.length > 0 && failed ? <Pressable accessibilityRole="button" onPress={retry}><Text style={m.subtitle}>일부 아티스트 조회 실패 · 다시 불러오기</Text></Pressable> : null}
    {artists.length > 0 ? <Text style={s.source}>{tab === 'SHOW' ? '공연 정보 · 공연예술통합전산망 KOPIS' : '공식 출처와 예매처 링크가 확인된 일정만 표시해요.'}</Text> : null}
  </View>;
}

const s = StyleSheet.create({
  section: { gap: 16 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  empty: { backgroundColor: colors.surfaceMuted, borderRadius: 16, padding: 20, gap: 12 },
  emptyTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  source: { color: '#91859C', fontSize: 9, lineHeight: 15 },
});
