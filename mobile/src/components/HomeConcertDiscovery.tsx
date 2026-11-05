import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { getHomeConcerts } from '@/api/concerts';
import { ConcertCard } from '@/components/ConcertCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { marketStyles as m } from '@/components/GoodsDemo';
import { useFavorites } from '@/lib/favorites';
import { discoveryConcerts } from '@/lib/home-discovery';
import { concertPhase } from '@/lib/home-concerts';
import { useResponsiveLayout } from '@/lib/use-responsive-layout';

export function HomeConcertDiscovery({ expanded = false }: { expanded?: boolean }) {
  const [phase, setPhase] = useState('전체');
  const [now] = useState(Date.now);
  const layout = useResponsiveLayout();
  const query = useQuery({ queryKey: ['home-discovery'], queryFn: getHomeConcerts, staleTime: 300000, retry: false });
  const { isConcertFavorite, toggleConcert } = useFavorites();
  const items = discoveryConcerts(query.data ?? [], now).filter(item => phase === '전체' || concertPhase(item, now) === phase);
  const cards = items.slice(0, expanded ? 24 : 8).map(item => <View key={item.id} style={expanded ? [m.gridItem, layout.isWide && { width: layout.cardWidth, maxWidth: layout.cardWidth, flexGrow: 0 }] : undefined}><ConcertCard concert={item} fluid={expanded}
    favorite={isConcertFavorite(item.id)} onFavoriteToggle={() => toggleConcert(item)}
    onPress={() => router.push({ pathname: '/concerts/[id]', params: { id: item.id, genre: item.genre } })} /></View>);
  return <View style={m.section}>
    {!expanded ? <View style={m.between}><Text style={m.sectionTitle}>공연 둘러보기</Text><Pressable accessibilityRole="button" accessibilityLabel="공연 둘러보기 전체 보기" onPress={() => router.push('/discover')}><Text style={m.sectionLink}>전체 보기 &gt;</Text></Pressable></View> : null}
    <View style={m.row}>{['전체', '예정', '진행 중'].map(label => <Pressable key={label} accessibilityRole="button" accessibilityLabel={`${label} 공연 둘러보기`} accessibilityState={{ selected: label === phase }} onPress={() => setPhase(label)} style={[m.chip, phase === label && m.chipSelected]}><Text style={[m.chipText, phase === label && m.chipSelectedText]}>{label}</Text></Pressable>)}</View>
    {query.isPending ? <LoadingSkeleton label="공연 둘러보기 불러오는 중" /> : query.isError ? <Pressable accessibilityRole="button" onPress={() => void query.refetch()}><Text style={m.subtitle}>공연을 불러오지 못했어요. 다시 시도</Text></Pressable>
      : items.length ? expanded ? <View style={m.grid}>{cards}</View> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>{cards}</ScrollView>
        : <Text style={m.subtitle}>현재 조회 범위에 해당하는 공연이 없어요.</Text>}
  </View>;
}
