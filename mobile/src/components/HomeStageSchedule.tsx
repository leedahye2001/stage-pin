import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getConcerts, getTicketOpenings } from '@/api/concerts';
import { ConcertCard } from '@/components/ConcertCard';
import { TicketingCarousel } from '@/components/TicketingCarousel';
import { marketStyles as m } from '@/components/GoodsDemo';
import { useFavorites } from '@/lib/favorites';
import { favoriteOpenings } from '@/lib/favorite-openings';
import { homeConcerts } from '@/lib/home-concerts';
import { colors } from '@/theme/tokens';

const tabs = [{ id: 'SHOW', label: '공연' }, { id: 'FAN_PRESALE', label: '선예매' }, { id: 'GENERAL_SALE', label: '일반예매' }] as const;

export function HomeStageSchedule() {
  const [tab, setTab] = useState<typeof tabs[number]['id']>('SHOW');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [now] = useState(Date.now);
  const { artists, isConcertFavorite, toggleConcert } = useFavorites();
  const concerts = useQuery({ queryKey: ['concerts', 'POPULAR_MUSIC'], queryFn: () => getConcerts('POPULAR_MUSIC'), retry: false });
  const openings = useQuery({ queryKey: ['ticket-openings'], queryFn: getTicketOpenings, enabled: tab !== 'SHOW', retry: false });
  const shows = homeConcerts(concerts.data ?? [], artists, favoritesOnly, now);
  const tickets = favoritesOnly ? favoriteOpenings(openings.data ?? [], artists) : openings.data ?? [];
  const active = tab === 'SHOW' ? concerts : openings;
  return <View style={s.section}>
    <View style={m.between}><Text style={m.sectionTitle}>공연·예매 일정</Text><Pressable accessibilityRole="button" accessibilityLabel="공연 전체 보기" onPress={() => router.push('/explore')}><Text style={m.sectionLink}>{'전체 보기 >'}</Text></Pressable></View>
    <View style={s.tabs}>{tabs.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.label} 일정 보기`} accessibilityState={{ selected: tab === item.id }} onPress={() => setTab(item.id)} style={[s.tab, tab === item.id && s.activeTab]}><Text style={[s.tabText, tab === item.id && s.activeText]}>{item.label}</Text></Pressable>)}</View>
    <Pressable accessibilityRole="checkbox" accessibilityLabel="찜한 아티스트 일정만 보기" accessibilityState={{ checked: favoritesOnly }} onPress={() => setFavoritesOnly(!favoritesOnly)} style={s.scope}><Ionicons name={favoritesOnly ? 'heart' : 'heart-outline'} size={15} color={favoritesOnly ? colors.primary : colors.textMuted} /><Text style={s.scopeText}>찜한 아티스트만</Text><Ionicons name={favoritesOnly ? 'checkbox' : 'square-outline'} size={16} color={colors.primary} /></Pressable>
    {favoritesOnly && !artists.length ? <View style={s.empty}><Text style={s.emptyTitle}>먼저 좋아하는 아티스트를 찜해보세요</Text><Text style={m.subtitle}>위의 하트를 누르면 이곳에서 일정을 모아볼 수 있어요.</Text></View>
      : active.isPending ? <ActivityIndicator color={colors.primary} />
      : active.isError ? <View style={s.empty}><Text style={m.subtitle}>일정을 불러오지 못했어요.</Text><Pressable accessibilityRole="button" onPress={() => active.refetch()}><Text style={m.link}>다시 불러오기</Text></Pressable></View>
      : tab === 'SHOW' ? shows.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>{shows.slice(0, 8).map((concert) => <ConcertCard key={concert.id} concert={concert} favorite={isConcertFavorite(concert.id)} onFavoriteToggle={() => toggleConcert(concert)} onPress={() => router.push({ pathname: '/concerts/[id]', params: { id: concert.id, genre: 'POPULAR_MUSIC' } })} />)}</ScrollView>
        : <View style={s.empty}><Ionicons name="calendar-outline" size={25} color={colors.primary} /><Text style={s.emptyTitle}>{favoritesOnly ? '찜한 아티스트의 등록된 공연이 없어요' : '지금 확인된 공연이 없어요'}</Text><Pressable accessibilityRole="button" onPress={() => router.push('/explore')}><Text style={m.link}>공연·아티스트 검색하기 ↗</Text></Pressable></View>
      : <TicketingCarousel openings={tickets} scheduleType={tab} title={tab === 'FAN_PRESALE' ? '선예매 일정' : '일반예매 일정'} compact />}
    <Text style={s.source}>{tab === 'SHOW' ? '공연 정보 · 공연예술통합전산망 KOPIS' : '공식 출처와 예매처 링크가 확인된 일정만 표시해요.'}</Text>
  </View>;
}

const s = StyleSheet.create({
  section: { gap: 16 },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { alignItems: 'center', justifyContent: 'center', paddingVertical: 11, paddingHorizontal: 20, minHeight: 44, borderRadius: 999, backgroundColor: colors.surfaceMuted }, activeTab: { backgroundColor: colors.buttonText },
  tabText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' }, activeText: { color: colors.white },
  scope: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, paddingVertical: 5 }, scopeText: { color: colors.textMuted, fontSize: 11 },
  empty: { backgroundColor: colors.surfaceMuted, borderRadius: 16, padding: 20, gap: 10 }, emptyTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  source: { color: '#91859C', fontSize: 9, lineHeight: 15 },
});
