import { useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getArtists } from '@/api/concerts';
import { ArtistPhoto } from '@/components/ArtistPhoto';
import { marketStyles as m } from '@/components/GoodsDemo';
import { demoArtists } from '@/lib/goods-demo';
import { useFavorites } from '@/lib/favorites';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { colors } from '@/theme/tokens';

const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export function HomeArtists() {
  const { artists: favorites, isArtistFavorite, toggleArtist } = useFavorites();
  const profiles = useQueries({ queries: demoArtists.map((item) => ({ queryKey: ['artists', item.name], queryFn: () => getArtists(item.name), staleTime: 3600000, retry: false })) });
  const recommended = profiles.flatMap((profile, index) => {
    const match = profile.data?.find((artist) => [artist.name, ...artist.aliases].some((alias) => normalize(alias) === normalize(demoArtists[index].name)));
    return match ? [match] : [];
  });
  const artists = [...new Map([...favorites.map((artist) => recommended.find((item) => item.id === artist.id) ?? artist), ...recommended].map((artist) => [artist.id, artist])).values()];
  return <View style={{ gap: 24 }}>
    <View style={m.section}>
      <View style={m.between}><Text style={m.sectionTitle}>좋아하는 아티스트</Text><Text style={s.creditHint}>하트로 내 취향을 핀!</Text></View>
      {artists.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.list}>
        {artists.map((artist) => <View key={artist.id} style={s.artist}>
          <ArtistPhoto artist={artist} size={66} favorite={isArtistFavorite(artist.id)} onFavoriteToggle={() => toggleArtist(artist)} />
          <Pressable accessibilityRole="button" accessibilityLabel={`${artist.name} 공연과 아티스트 보기`} onPress={() => router.push({ pathname: '/artists/[id]', params: { id: artist.id, query: artist.searchName } })}><Text numberOfLines={1} style={s.name}>{artist.name}</Text></Pressable>
        </View>)}
      </ScrollView> : null}
      {!artists.length && profiles.some((item) => item.isPending) ? <LoadingSkeleton kind="artists" label="아티스트 프로필 불러오는 중" /> : null}
      {profiles.some((item) => item.isError) ? <View style={{ gap: 9 }}><Text style={s.error}>일부 아티스트 조회가 지연되고 있어요. 잠시 후 다시 시도해 주세요.</Text><Pressable accessibilityRole="button" onPress={() => profiles.filter((item) => item.isError).forEach((item) => item.refetch())}><Text style={m.link}>조회에 실패한 프로필 다시 불러오기</Text></Pressable></View> : null}
    </View>
  </View>;
}

const s = StyleSheet.create({
  list: { gap: 15, paddingVertical: 5 },
  artist: { width: 83, alignItems: 'center', gap: 6 },
  name: { color: colors.text, fontSize: 10, fontWeight: '800', maxWidth: 83 },
  creditHint: { fontSize: 9, color: '#92839D', lineHeight: 16 },
  error: { fontSize: 11, color: '#AA5E5E', lineHeight: 19 },
});
