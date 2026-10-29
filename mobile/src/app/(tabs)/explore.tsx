import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getHomeConcerts } from '@/api/concerts';
import { ConcertMap } from '@/components/ConcertMap';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { mapVenues } from '@/lib/map-venues';
import { responsiveStyles, useResponsiveLayout } from '@/lib/use-responsive-layout';
import { colors } from '@/theme/tokens';

export default function MapScreen() {
  const { isWide } = useResponsiveLayout();
  const [mode, setMode] = useState<'venues' | 'exchange'>('venues');
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ['concerts', 'POPULAR_MUSIC', 'home'],
    queryFn: getHomeConcerts,
  });
  const venues = useMemo(() => mapVenues(query.data ?? []), [query.data]);
  const markers = useMemo(() => venues.map(group => group.concerts[0]), [venues]);
  const selected = venues.find(group => group.key === selectedVenue);
  const selectMarker = useCallback((concertId: string) => {
    const group = venues.find(item => item.concerts.some(concert => concert.id === concertId));
    if (group) setSelectedVenue(group.key);
  }, [venues]);

  return <SafeAreaView edges={['top']} style={s.safe}>
    <ScrollView contentContainerStyle={[s.content, isWide && responsiveStyles.content]}>
      <Text style={s.title}>지도</Text>
      <View style={s.tabs}>
        {([{ key: 'venues', label: '공연 장소' }, { key: 'exchange', label: '현장 교환' }] as const).map(tab =>
          <Pressable key={tab.key} accessibilityRole="tab" accessibilityState={{ selected: mode === tab.key }} onPress={() => setMode(tab.key)} style={[s.tab, mode === tab.key && s.activeTab]}>
            <Text style={[s.tabText, mode === tab.key && s.activeText]}>{tab.label}</Text>
          </Pressable>)}
      </View>
      {mode === 'exchange' ? <View style={s.empty}>
        <Ionicons name="swap-horizontal-outline" size={32} color={colors.textMuted} />
        <Text style={s.emptyTitle}>현장 교환 지도는 준비 중이에요</Text>
        <Text style={s.note}>공연과 날짜별 교환 글을 연결할 예정이에요. 현재 위치를 수집하거나 공개하지 않아요.</Text>
        <Pressable accessibilityRole="link" onPress={() => router.push('/goods')} style={s.button}><Text style={s.buttonText}>굿즈 보기 →</Text></Pressable>
      </View> : query.isPending ? <LoadingSkeleton kind="map" label="공연 장소 불러오는 중" />
        : query.isError ? <View style={s.empty}>
          <Text style={s.emptyTitle}>공연 장소를 불러오지 못했어요</Text>
          <Pressable accessibilityRole="button" onPress={() => query.refetch()} style={s.button}><Text style={s.buttonText}>다시 시도</Text></Pressable>
        </View> : venues.length ? <>
          <ConcertMap concerts={markers} onSelect={selectMarker} initialRealMap height={isWide ? 460 : 370} />
          <View style={s.heading}>
            <Text style={s.sectionTitle}>{selected ? selected.venue.name : '공연 장소'}</Text>
            {selected ? <Pressable accessibilityRole="button" onPress={() => setSelectedVenue(null)}><Text style={s.buttonText}>전체 장소 보기</Text></Pressable> : <Text style={s.note}>{venues.length}곳</Text>}
          </View>
          {!selected ? venues.map(group => <Pressable key={group.key} accessibilityRole="button" accessibilityLabel={`${group.venue.name} 공연 ${group.concerts.length}개 보기`} onPress={() => setSelectedVenue(group.key)} style={s.row}>
            <View style={s.icon}><Ionicons name="location-outline" color={colors.primary} size={22} /></View>
            <View style={s.copy}><Text style={s.name}>{group.venue.name}</Text><Text style={s.note}>{group.venue.city} · 공연 {group.concerts.length}개</Text></View>
            <Ionicons name="chevron-forward" color={colors.textMuted} size={18} />
          </Pressable>) : <>
            <Text style={s.note}>{selected.venue.address || selected.venue.city}</Text>
            {selected.concerts.map(concert => <Pressable key={concert.id} accessibilityRole="link" onPress={() => router.push({ pathname: '/concerts/[id]', params: { id: concert.id, genre: concert.genre } })} style={s.row}>
              {concert.posterUrl ? <Image source={{ uri: concert.posterUrl }} style={s.poster} resizeMode="cover" /> : <View style={[s.icon, s.poster]}><Ionicons name="musical-notes-outline" size={22} color={colors.textMuted} /></View>}
              <View style={s.copy}><Text style={s.name}>{concert.title}</Text><Text style={s.note}>{new Date(concert.startsAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</Text></View>
              <Ionicons name="chevron-forward" color={colors.textMuted} size={18} />
            </Pressable>)}
          </>}
          <Text style={s.note}>공연 데이터: 공연예술통합전산망(KOPIS) · 현재 조회된 공연 중 위치가 확인된 장소만 표시해요.</Text>
        </> : <View style={s.empty}><Text style={s.emptyTitle}>표시할 공연 장소가 없어요</Text><Text style={s.note}>현재 조회된 공연에 확인 가능한 위치 정보가 없어요.</Text></View>}
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32, gap: 20 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, backgroundColor: colors.button },
  activeTab: { backgroundColor: colors.text },
  tabText: { fontSize: 14, fontWeight: '700', color: colors.buttonText },
  activeText: { color: colors.white },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { flex: 1, fontSize: 19, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  copy: { flex: 1, gap: 6 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  note: { fontSize: 12, lineHeight: 19, color: colors.textMuted },
  poster: { width: 52, height: 72, borderRadius: 8 },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  empty: { paddingVertical: 48, paddingHorizontal: 24, alignItems: 'center', gap: 16, backgroundColor: colors.surfaceMuted, borderRadius: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  button: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.button, borderRadius: 999 },
  buttonText: { fontSize: 13, fontWeight: '700', color: colors.text },
});
