import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { getArtists } from '@/api/concerts';
import { ArtistPhoto } from '@/components/ArtistPhoto';
import { useFavorites } from '@/lib/favorites';
import { colors } from '@/theme/tokens';

export function HomeSearch() {
  const [query, setQuery] = useState('');
  const [keyword, setKeyword] = useState('');
  const { isArtistFavorite, toggleArtist } = useFavorites();
  useEffect(() => { const timer = setTimeout(() => setKeyword(query.trim()), 450); return () => clearTimeout(timer); }, [query]);
  const results = useQuery({ queryKey: ['artists', keyword], queryFn: () => getArtists(keyword), enabled: keyword.length >= 1, retry: false, staleTime: 3600000 });
  const searching = query.trim().length >= 1;
  const pending = keyword !== query.trim() || results.isPending;
  const searchConcerts = () => { if (query.trim()) router.push({ pathname: '/search', params: { query: query.trim() } }); };
  return <View style={s.container}>
    <View style={s.search}><Ionicons name="search" size={20} color={colors.primary} /><TextInput accessibilityLabel="아티스트 또는 공연 검색" placeholder="아티스트, 공연명을 검색해보세요" placeholderTextColor="#94899D" value={query} onChangeText={setQuery} onSubmitEditing={searchConcerts} returnKeyType="search" autoCapitalize="none" autoCorrect={false} style={s.input} />{query ? <Pressable accessibilityRole="button" accessibilityLabel="홈 검색어 지우기" onPress={() => setQuery('')}><Ionicons name="close-circle" size={19} color="#A398AF" /></Pressable> : null}</View>
    {searching ? <View style={s.dropdown}>
      <Text style={s.caption}>아티스트를 찜하면 홈에서 예매 일정을 모아봐요</Text>
      {pending ? <LoadingSkeleton kind="search" label="아티스트 검색 중" />
        : results.data?.length ? results.data.map((artist) => <View key={artist.id} style={s.row}>
          <ArtistPhoto artist={artist} size={43} />
          <Pressable accessibilityRole="button" accessibilityLabel={`${artist.name} 아티스트 보기`} onPress={() => { setQuery(''); router.push({ pathname: '/artists/[id]', params: { id: artist.id, query: artist.searchName } }); }} style={{ flex: 1 }}><Text style={s.name}>{artist.name}</Text><Text style={s.hint} numberOfLines={1}>{artist.aliases.slice(0, 3).join(' · ')}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`${artist.name} 아티스트 찜`} accessibilityState={{ selected: isArtistFavorite(artist.id) }} onPress={() => toggleArtist(artist)} style={s.heart}><Ionicons name={isArtistFavorite(artist.id) ? 'heart' : 'heart-outline'} color={colors.primary} size={23} /></Pressable>
        </View>) : <Text style={s.hint}>{results.isError ? '아티스트 조회에 실패했어요. 공연 검색은 아래에서 계속할 수 있어요.' : '일치하는 아티스트가 없어요. 공연명으로도 검색해보세요.'}</Text>}
      <Pressable accessibilityRole="button" onPress={searchConcerts} style={s.concertSearch}><Ionicons name="ticket-outline" size={19} color={colors.primary} /><Text style={s.link}>‘{query.trim()}’ 공연·공연장 검색</Text><Ionicons name="arrow-forward" size={17} color={colors.primary} /></Pressable>
    </View> : null}
  </View>;
}

const s = StyleSheet.create({
  container: { gap: 12, backgroundColor: colors.background, paddingBottom: 10 },
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
