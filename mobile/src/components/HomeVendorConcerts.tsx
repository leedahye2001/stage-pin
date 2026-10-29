import { useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getConcert, getConcerts, type TicketVendor } from '@/api/concerts';
import { ConcertCard } from '@/components/ConcertCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { marketStyles as m } from '@/components/GoodsDemo';
import { useFavorites } from '@/lib/favorites';
import { artistConcertKeywords, concertVendors, popularArtists, vendorConcertCandidates } from '@/lib/home-concerts';
import { colors } from '@/theme/tokens';

const vendors: { id: TicketVendor | 'ALL'; label: string }[] = [
  { id: 'ALL', label: '전체' }, { id: 'NOL', label: 'NOL' }, { id: 'YES24', label: 'YES24' },
  { id: 'MELON', label: '멜론티켓' }, { id: 'TICKETLINK', label: '티켓링크' }, { id: 'OTHER', label: '기타' },
];

export function HomeVendorConcerts() {
  const [vendor, setVendor] = useState<TicketVendor | 'ALL'>('ALL');
  const [now] = useState(Date.now);
  const { isConcertFavorite, toggleConcert } = useFavorites();
  const searches = useQueries({ queries: artistConcertKeywords(popularArtists).map(keyword => ({
    queryKey: ['concerts', 'POPULAR_MUSIC', 'following', keyword],
    queryFn: () => getConcerts('POPULAR_MUSIC', keyword), staleTime: 300_000, retry: false,
  })) });
  const searching = searches.some(query => query.isPending);
  const candidates = vendorConcertCandidates(searches.flatMap(query => query.data ?? []), now);
  const details = useQueries({ queries: candidates.map(concert => ({
    queryKey: ['concert-detail', concert.id, 'POPULAR_MUSIC'],
    queryFn: () => getConcert(concert.id, 'POPULAR_MUSIC'), enabled: !searching, staleTime: 1_800_000, retry: false,
  })) });
  const concerts = candidates.map((concert, index) => details[index]?.data ?? concert);
  const items = concerts.filter(concert => vendor === 'ALL' || concertVendors(concert).includes(vendor));
  const pending = searching || details.some(query => query.isPending || query.isFetching);
  const failed = searches.some(query => query.isError) || details.some(query => query.isError);

  return <View style={s.section}>
    <Text style={m.sectionTitle}>예매처별 공연 일정</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {vendors.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.label} 예매처 공연 보기`} accessibilityState={{ selected: vendor === item.id }} onPress={() => setVendor(item.id)} style={[m.chip, vendor === item.id && m.chipSelected]}><Text style={[m.chipText, vendor === item.id && m.chipSelectedText]}>{item.label}</Text></Pressable>)}
    </ScrollView>
    {items.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
      {items.map(concert => <View key={concert.id} style={{ width: 196 }}>
        <ConcertCard concert={concert} favorite={isConcertFavorite(concert.id)} onFavoriteToggle={() => toggleConcert(concert)} onPress={() => router.push({ pathname: '/concerts/[id]', params: { id: concert.id, genre: concert.genre } })} />
      </View>)}
    </ScrollView> : pending ? <LoadingSkeleton kind="concerts" label="예매처별 공연 불러오는 중" /> : <View style={s.empty}><Text style={s.emptyText}>{failed ? '일부 공연 정보를 불러오지 못했어요.' : vendor === 'ALL' ? '조회된 공연이 없어요.' : '조회된 공연 중 이 예매처의 링크가 확인된 공연이 없어요.'}</Text>{vendor !== 'ALL' && candidates.length ? <Pressable accessibilityRole="button" onPress={() => details.forEach(query => query.refetch())}><Text style={m.sectionLink}>예매처 다시 확인</Text></Pressable> : null}</View>}
  </View>;
}

const s = StyleSheet.create({
  section: { gap: 16 },
  empty: { backgroundColor: colors.surfaceMuted, borderRadius: 16, padding: 20 },
  emptyText: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
});
