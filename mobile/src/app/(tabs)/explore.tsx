import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getHomeConcerts, type Concert } from '@/api/concerts';
import { ConcertMap } from '@/components/ConcertMap';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import type { MapLocation } from '@/lib/current-location';
import { useFavorites } from '@/lib/favorites';
import { concertPhase } from '@/lib/home-concerts';
import { discoverVenues, type MapPeriod } from '@/lib/map-discovery';
import { responsiveStyles, useResponsiveLayout } from '@/lib/use-responsive-layout';
import { colors } from '@/theme/tokens';

const periods: { key: MapPeriod; label: string }[] = [
  { key: 'all', label: '전체 기간' }, { key: 'today', label: '오늘' }, { key: 'week', label: '7일 이내' }, { key: 'month', label: '이번 달' },
];
const dateLabel = (date: string) => new Date(date).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' });
const webInputFocusStyle = { outlineStyle: 'none', outlineWidth: 0 } as unknown as TextStyle;

export default function MapScreen() {
  const { isWide } = useResponsiveLayout();
  const favorites = useFavorites();
  const [mode, setMode] = useState<'venues' | 'exchange'>('venues');
  const [keyword, setKeyword] = useState('');
  const [period, setPeriod] = useState<MapPeriod>('all');
  const [city, setCity] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [linkError, setLinkError] = useState('');
  const [now] = useState(Date.now);
  const query = useQuery({ queryKey: ['concerts', 'POPULAR_MUSIC', 'home'], queryFn: getHomeConcerts });
  const concerts = useMemo(() => [...new Map([...favorites.concerts, ...(query.data ?? [])].map(concert => [concert.id, concert])).values()], [favorites.concerts, query.data]);
  const cities = useMemo(() => [...new Set(concerts.map(concert => concert.venue.city).filter(Boolean))].sort(), [concerts]);
  const venues = useMemo(() => discoverVenues(concerts, { query: keyword, period, city, favoritesOnly: onlyFavorites,
    favoriteIds: favorites.concerts.map(concert => concert.id), location, now }), [concerts, keyword, period, city, onlyFavorites, favorites.concerts, location, now]);
  const markers = useMemo(() => venues.map(group => group.concerts[0]), [venues]);
  const counts = useMemo(() => Object.fromEntries(venues.map(group => [group.concerts[0].id, group.concerts.length])), [venues]);
  const selected = venues.find(group => group.key === selectedKey);
  const selectMarker = useCallback((id: string) => {
    const group = venues.find(item => item.concerts.some(concert => concert.id === id));
    if (group) setSelectedKey(group.key);
  }, [venues]);
  const reset = () => { setKeyword(''); setPeriod('all'); setCity(''); setOnlyFavorites(false); setSelectedKey(null); };
  const openDirections = async () => {
    if (!selected) return;
    setLinkError('');
    try { await Linking.openURL(`https://map.kakao.com/link/to/${encodeURIComponent(selected.venue.name)},${selected.venue.latitude},${selected.venue.longitude}`); }
    catch { setLinkError('길찾기를 열지 못했어요. 다시 시도해 주세요.'); }
  };
  const resultList = <View style={[s.results, isWide && s.desktopResults]}>
    {!isWide ? <View style={s.handle} /> : null}
    <View style={s.between}>
      {selected ? <Pressable accessibilityRole="button" accessibilityLabel="전체 공연장 목록으로 돌아가기" onPress={() => setSelectedKey(null)} style={s.back}><Ionicons name="chevron-back" size={18} color={colors.text} /><Text style={s.resultTitle}>장소 목록</Text></Pressable>
        : <Text style={s.resultTitle}>공연 장소 <Text style={{ color: colors.primary }}>{venues.length}</Text></Text>}
      <Text style={s.meta}>{location ? '가까운 순' : '이름순'}</Text>
    </View>
    {selected ? <>
      <Text style={s.venueTitle}>{selected.venue.name}</Text>
      <Text selectable style={s.meta}>{selected.venue.address || selected.venue.city}</Text>
      <View style={s.between}><Text style={s.meta}>{selected.concerts.length}개 공연{selected.distance !== null ? ` · ${selected.distance.toFixed(1)}km` : ''}</Text>
        <Pressable accessibilityRole="link" onPress={() => void openDirections()} style={s.directions}><Ionicons name="navigate-outline" size={15} color={colors.text} /><Text style={s.actionText}>길찾기</Text></Pressable></View>
      {linkError ? <Text accessibilityRole="alert" style={s.meta}>{linkError}</Text> : null}
      {selected.concerts.map(concert => <View key={concert.id} style={s.concertRow}>
        <Pressable accessibilityRole="link" accessibilityLabel={`${concert.title} 공연 상세 보기`} onPress={() => router.push({ pathname: '/concerts/[id]', params: { id: concert.id, genre: concert.genre } })} style={s.concertLink}>
          <MapPoster concert={concert} />
          <View style={s.copy}><Text style={s.phase}>{concertPhase(concert, now)}</Text><Text numberOfLines={2} style={s.name}>{concert.title}</Text><Text style={s.meta}>{dateLabel(concert.startsAt)}{concert.endsAt && concert.endsAt !== concert.startsAt ? ` ~ ${dateLabel(concert.endsAt)}` : ''}</Text></View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`${concert.title} ${favorites.isConcertFavorite(concert.id) ? '찜 해제' : '찜하기'}`} accessibilityState={{ selected: favorites.isConcertFavorite(concert.id) }} onPress={() => favorites.toggleConcert(concert)} style={s.heart}><Ionicons name={favorites.isConcertFavorite(concert.id) ? 'heart' : 'heart-outline'} size={21} color={favorites.isConcertFavorite(concert.id) ? colors.primary : colors.textMuted} /></Pressable>
      </View>)}
    </> : venues.length ? venues.map((group, index) => <Pressable key={group.key} accessibilityRole="button" accessibilityLabel={`${group.venue.name} 공연 ${group.concerts.length}개 보기`} onPress={() => setSelectedKey(group.key)} style={({ pressed }) => [s.venueRow, pressed && { opacity: 0.65 }]}>
      <MapPoster concert={group.concerts[0]} />
      <View style={s.copy}><View style={s.between}><Text style={s.number}>{String(index + 1).padStart(2, '0')}</Text><Text style={s.count}>공연 {group.concerts.length}</Text></View><Text numberOfLines={2} style={s.name}>{group.venue.name}</Text><Text numberOfLines={1} style={s.meta}>{group.venue.city}{group.distance !== null ? ` · ${group.distance.toFixed(1)}km` : ''}</Text><Text numberOfLines={1} style={s.preview}>{group.concerts[0].title}</Text></View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>) : <View style={s.empty}><Ionicons name="search-outline" size={28} color={colors.textMuted} /><Text style={s.name}>조건에 맞는 공연 장소가 없어요</Text><Pressable accessibilityRole="button" onPress={reset} style={s.button}><Text style={s.actionText}>필터 초기화</Text></Pressable></View>}
    <Text style={s.source}>현재 불러온 공연과 찜한 공연 중 위치가 확인된 장소예요. 모든 공연장을 검색하는 기능은 아니에요.</Text>
  </View>;

  return <SafeAreaView edges={['top']} style={s.safe}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content, isWide && responsiveStyles.content, isWide && { gap: 16, paddingTop: 24 }]}>
      <View style={s.between}><Text style={s.title}>지도</Text><View style={s.tabs}>{([{ key: 'venues', label: '공연 장소' }, { key: 'exchange', label: '현장 교환' }] as const).map(tab => <Pressable key={tab.key} accessibilityRole="tab" accessibilityLabel={`${tab.label} 지도`} accessibilityState={{ selected: mode === tab.key }} onPress={() => setMode(tab.key)} style={[s.tab, mode === tab.key && s.activeTab]}><Text style={[s.tabText, mode === tab.key && s.activeText]}>{tab.label}</Text></Pressable>)}</View></View>
      {mode === 'exchange' ? <View style={s.empty}><Ionicons name="swap-horizontal-outline" size={32} color={colors.textMuted} /><Text style={s.name}>현장 교환 지도는 준비 중이에요</Text><Text style={s.meta}>공연별 교환 글을 연결할 예정이에요. 다른 사용자에게 내 위치를 공개하지 않아요.</Text><Pressable accessibilityRole="link" onPress={() => router.push('/goods?method=현장')} style={s.button}><Text style={s.actionText}>현장 교환 굿즈 보기</Text></Pressable></View> : <>
        <View style={s.search}><Ionicons name="search-outline" size={20} color={colors.textMuted} /><TextInput accessibilityLabel="지도에서 공연장 아티스트 공연 검색" placeholder="공연장, 아티스트, 공연명 검색" placeholderTextColor={colors.textMuted} value={keyword} onChangeText={setKeyword} style={[s.input, Platform.OS === 'web' && webInputFocusStyle]} />{keyword ? <Pressable accessibilityRole="button" accessibilityLabel="지도 검색어 지우기" onPress={() => setKeyword('')}><Ionicons name="close-circle" size={19} color={colors.textMuted} /></Pressable> : null}</View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
          {periods.map(item => <Pressable key={item.key} accessibilityRole="button" accessibilityLabel={`${item.label} 공연 필터`} accessibilityState={{ selected: period === item.key }} onPress={() => setPeriod(item.key)} style={[s.chip, period === item.key && s.activeChip]}><Text style={[s.chipText, period === item.key && s.activeChipText]}>{item.label}</Text></Pressable>)}
          <View style={s.divider} /><Pressable accessibilityRole="checkbox" accessibilityLabel="찜한 공연만 지도에 표시" accessibilityState={{ checked: onlyFavorites }} onPress={() => setOnlyFavorites(!onlyFavorites)} style={[s.chip, onlyFavorites && s.activeChip]}><Ionicons name={onlyFavorites ? 'heart' : 'heart-outline'} size={14} color={onlyFavorites ? colors.white : colors.text} /><Text style={[s.chipText, onlyFavorites && s.activeChipText]}>찜한 공연</Text></Pressable>
        </ScrollView>
        {cities.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{['', ...cities].map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value || '전체 지역'} 공연 장소`} accessibilityState={{ selected: city === value }} onPress={() => setCity(value)} style={s.city}><Text style={[s.meta, city === value && s.selectedCity]}>{value || '전체 지역'}</Text></Pressable>)}</ScrollView> : null}
        {query.isPending && !concerts.length ? <LoadingSkeleton kind="map" label="공연 장소 불러오는 중" /> : query.isError && !concerts.length ? <View style={s.empty}><Text style={s.name}>공연 장소를 불러오지 못했어요</Text><Pressable accessibilityRole="button" onPress={() => query.refetch()} style={s.button}><Text style={s.actionText}>다시 시도</Text></Pressable></View> : <>
          {query.isError ? <Text accessibilityRole="alert" style={s.meta}>새 공연을 불러오지 못해 찜한 공연의 장소만 표시해요.</Text> : null}
          <View style={[s.workspace, isWide && s.desktopWorkspace]}>
            <View style={[s.mapPane, isWide && s.desktopMap]}><ConcertMap concerts={markers} onSelect={selectMarker} selectedConcertId={selected?.concerts[0].id} venueCounts={counts} onLocationChange={setLocation} initialRealMap autoLocate hideFootprintToggle height={isWide ? 620 : 350} /></View>
            {isWide ? <ScrollView style={s.sideScroll} contentContainerStyle={{ flexGrow: 1 }} nestedScrollEnabled>{resultList}</ScrollView> : resultList}
          </View>
        </>}
      </>}
    </ScrollView>
  </SafeAreaView>;
}

function MapPoster({ concert }: { concert: Concert }) {
  const [failed, setFailed] = useState(false);
  return concert.posterUrl && !failed ? <Image accessibilityLabel={`${concert.title} 포스터`} source={{ uri: concert.posterUrl }} onError={() => setFailed(true)} style={s.poster} resizeMode="cover" /> : <View style={[s.poster, s.posterFallback]}><Ionicons name="musical-notes-outline" size={22} color={colors.textMuted} /></View>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingBottom: 36, gap: 16 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  tabs: { flexDirection: 'row', gap: 4, backgroundColor: colors.surfaceMuted, padding: 4, borderRadius: 999 }, tab: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 }, activeTab: { backgroundColor: colors.text }, tabText: { fontSize: 12, fontWeight: '700', color: colors.textMuted }, activeText: { color: colors.white },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceMuted, borderRadius: 999, paddingHorizontal: 18, minHeight: 50 }, input: { flex: 1, minWidth: 0, fontSize: 14, paddingVertical: 14, color: colors.text, outlineWidth: 0 },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 8 }, chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceMuted, paddingHorizontal: 15, paddingVertical: 11, borderRadius: 999 }, activeChip: { backgroundColor: colors.text }, chipText: { fontSize: 12, fontWeight: '600', color: colors.text }, activeChipText: { color: colors.white }, divider: { width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 3 }, city: { paddingHorizontal: 10, paddingVertical: 6 }, selectedCity: { fontWeight: '800', color: colors.primary },
  workspace: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white }, desktopWorkspace: { flexDirection: 'row-reverse', height: 620 }, mapPane: { overflow: 'hidden' }, desktopMap: { flex: 1, minWidth: 0 }, sideScroll: { width: 360, flexGrow: 0, borderRightWidth: 1, borderRightColor: colors.border },
  results: { padding: 18, gap: 14, backgroundColor: colors.white }, desktopResults: { padding: 20 }, handle: { width: 36, height: 4, borderRadius: 4, backgroundColor: colors.border, alignSelf: 'center', marginTop: -5 }, resultTitle: { fontSize: 16, fontWeight: '800', color: colors.text }, venueTitle: { fontSize: 21, fontWeight: '800', color: colors.text }, back: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  venueRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }, poster: { width: 62, height: 86, borderRadius: 10 }, posterFallback: { backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, minWidth: 0, gap: 6 }, number: { color: colors.textMuted, fontSize: 11, fontWeight: '700' }, count: { color: colors.primary, fontSize: 11, fontWeight: '700' }, name: { color: colors.text, fontSize: 15, fontWeight: '700', lineHeight: 21 }, meta: { color: colors.textMuted, fontSize: 12, lineHeight: 18 }, preview: { color: colors.text, fontSize: 11, lineHeight: 17 },
  concertRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }, concertLink: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }, phase: { fontSize: 11, color: colors.primary, fontWeight: '700' }, heart: { padding: 10 }, directions: { flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 99, padding: 10 }, actionText: { fontSize: 12, fontWeight: '700', color: colors.text },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16, minHeight: 210 }, button: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.surfaceMuted, borderRadius: 999 }, source: { fontSize: 10, lineHeight: 17, color: colors.textMuted, marginTop: 8 },
});
