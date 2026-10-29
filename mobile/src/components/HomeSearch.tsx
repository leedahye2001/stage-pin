import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type TextStyle } from 'react-native';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { getArtists, getPopularSearches, recordPopularSearch } from '@/api/concerts';
import { ArtistPhoto } from '@/components/ArtistPhoto';
import { useFavorites } from '@/lib/favorites';
import { colors } from '@/theme/tokens';
import { useResponsiveLayout } from '@/lib/use-responsive-layout';
import { millisecondsUntilNextHour, popularSearchUpdateLabel } from '@/lib/popular-search';
import { useOutsidePressListeners } from '@/components/OutsidePressProvider';

// RN's native types omit CSS 'none'; WebKit's auto outline ignores width: 0 alone.
const webInputFocusStyle = { outlineStyle: 'none', outlineWidth: 0 } as unknown as TextStyle;

export function HomeSearch() {
  const { isWide } = useResponsiveLayout();
  const [query, setQuery] = useState('');
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const container = useRef<ComponentRef<typeof View>>(null);
  const outsideListeners = useOutsidePressListeners();
  const popular = useQuery({ queryKey: ['popular-searches'], queryFn: getPopularSearches, enabled: open && !query.trim(), staleTime: 0, refetchInterval: () => millisecondsUntilNextHour(), retry: false });
  const record = (term: string) => { void recordPopularSearch(term).catch(() => {}); };
  useEffect(() => {
    if (!open) return;
    if (Platform.OS === 'web') {
      const dismissOutside = (event: Event) => {
        const element = container.current as unknown as HTMLElement | null;
        if (element && !element.contains(event.target as Node)) { setOpen(false); setFocused(false); }
      };
      document.addEventListener('pointerdown', dismissOutside, true);
      document.addEventListener('focusin', dismissOutside, true);
      return () => { document.removeEventListener('pointerdown', dismissOutside, true); document.removeEventListener('focusin', dismissOutside, true); };
    }
    const dismissOutside = (x: number, y: number) => container.current?.measureInWindow((left, top, width, height) => {
      if (x < left || x > left + width || y < top || y > top + height) { setOpen(false); setFocused(false); }
    });
    outsideListeners?.add(dismissOutside);
    return () => { outsideListeners?.delete(dismissOutside); };
  }, [open, outsideListeners]);
  const { isArtistFavorite, toggleArtist } = useFavorites();
  useEffect(() => { const timer = setTimeout(() => setKeyword(query.trim()), 450); return () => clearTimeout(timer); }, [query]);
  const results = useQuery({ queryKey: ['artists', keyword], queryFn: () => getArtists(keyword), enabled: keyword.length >= 1, retry: false, staleTime: 3600000 });
  const searching = query.trim().length >= 1;
  const pending = keyword !== query.trim() || results.isPending;
  const search = (term: string) => { if (term.trim()) { record(term.trim()); setOpen(false); router.push({ pathname: '/search', params: { query: term.trim() } }); } };
  const searchConcerts = () => search(query);
  return <View ref={container} collapsable={false} style={[s.container, isWide && { paddingBottom: 0, zIndex: 30 }]}>
    <View style={[s.search, focused && { borderColor: '#8B8B92' }]}><Ionicons name="search" size={20} color={colors.primary} /><TextInput accessibilityLabel="아티스트 또는 공연 검색" placeholder="아티스트, 공연명을 검색해보세요" placeholderTextColor="#94899D" value={query} onFocus={() => { setOpen(true); setFocused(true); }} onBlur={() => setFocused(false)} onKeyPress={({ nativeEvent }) => { if (nativeEvent.key === 'Escape') setOpen(false); }} onChangeText={(text) => { setQuery(text); setOpen(true); }} onSubmitEditing={searchConcerts} returnKeyType="search" autoCapitalize="none" autoCorrect={false} style={[s.input, Platform.OS === 'web' && webInputFocusStyle]} />{query ? <Pressable accessibilityRole="button" accessibilityLabel="홈 검색어 지우기" onPress={() => { setQuery(''); setOpen(true); }}><Ionicons name="close-circle" size={19} color="#A398AF" /></Pressable> : null}</View>
    {open ? <View style={[s.dropdown, isWide && { position: 'absolute', top: 60, left: 0, right: 0, zIndex: 30 }]}>
      <View style={s.heading}><Text style={s.name}>{searching ? '검색 결과' : '인기 검색어'}</Text><Pressable accessibilityRole="button" accessibilityLabel="검색 목록 닫기" onPress={() => setOpen(false)} hitSlop={8}><Ionicons name="close" size={18} color={colors.textMuted} /></Pressable></View>
      {!searching ? <>
        {popular.isPending ? <LoadingSkeleton kind="search" label="인기 검색어 불러오는 중" /> : popular.isError ? <Pressable accessibilityRole="button" onPress={() => void popular.refetch()}><Text style={s.hint}>인기 검색어를 불러오지 못했어요. 다시 시도</Text></Pressable> : <View style={s.popularGrid}>{popular.data?.items.map((item, index) => <Pressable key={item.term} accessibilityRole="button" accessibilityLabel={`인기 검색어 ${index + 1}위 ${item.term} 검색`} onPress={() => search(item.term)} style={s.popularItem}><Text style={s.rank}>{index + 1}</Text><Text numberOfLines={1} style={s.term}>{item.term}</Text></Pressable>)}</View>}
        {popular.data?.updatedAt ? <Text style={s.hint}>{popularSearchUpdateLabel(popular.data.updatedAt)}</Text> : null}
      </> : <>
      <Text style={s.caption}>아티스트를 찜하면 홈에서 예매 일정을 모아봐요</Text>
      {pending ? <LoadingSkeleton kind="search" label="아티스트 검색 중" />
        : results.data?.length ? results.data.map((artist) => <View key={artist.id} style={s.row}>
          <ArtistPhoto artist={artist} size={43} />
          <Pressable accessibilityRole="button" accessibilityLabel={`${artist.name} 아티스트 보기`} onPress={() => { record(artist.searchName); setOpen(false); setQuery(''); router.push({ pathname: '/artists/[id]', params: { id: artist.id, query: artist.searchName } }); }} style={{ flex: 1 }}><Text style={s.name}>{artist.name}</Text><Text style={s.hint} numberOfLines={1}>{artist.aliases.slice(0, 3).join(' · ')}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`${artist.name} 아티스트 찜`} accessibilityState={{ selected: isArtistFavorite(artist.id) }} onPress={() => toggleArtist(artist)} style={s.heart}><Ionicons name={isArtistFavorite(artist.id) ? 'heart' : 'heart-outline'} color={colors.primary} size={23} /></Pressable>
        </View>) : <Text style={s.hint}>{results.isError ? '아티스트 조회에 실패했어요. 공연 검색은 아래에서 계속할 수 있어요.' : '일치하는 아티스트가 없어요. 공연명으로도 검색해보세요.'}</Text>}
      <Pressable accessibilityRole="button" onPress={searchConcerts} style={s.concertSearch}><Ionicons name="ticket-outline" size={19} color={colors.primary} /><Text style={s.link}>‘{query.trim()}’ 공연·공연장 검색</Text><Ionicons name="arrow-forward" size={17} color={colors.primary} /></Pressable>
      </>}
    </View> : null}
  </View>;
}

const s = StyleSheet.create({
  container: { gap: 12, backgroundColor: colors.background, paddingBottom: 10 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  popularGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  popularItem: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingRight: 8, minHeight: 42 },
  rank: { width: 20, textAlign: 'center', color: colors.primary, fontSize: 13, fontWeight: '700' },
  term: { flex: 1, color: colors.text, fontSize: 12 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, borderRadius: 999, minHeight: 51 },
  input: { flex: 1, minWidth: 0, paddingVertical: 15, fontSize: 13, color: colors.text },
  dropdown: { backgroundColor: '#FFFFFF', padding: 14, gap: 15, borderRadius: 18, borderWidth: 1, borderColor: '#E6DFF1' },
  caption: { color: colors.primary, fontSize: 10, lineHeight: 17 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: colors.text, fontSize: 13, fontWeight: '800', lineHeight: 21 },
  hint: { color: colors.textMuted, fontSize: 10, lineHeight: 18 },
  heart: { padding: 10 },
  concertSearch: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#EEE8F6' },
  link: { color: colors.primary, fontSize: 12, fontWeight: '700', flexShrink: 1 },
});
