import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getArtists, getTicketOpenings } from '@/api/concerts';
import { ArtistPhoto } from '@/components/ArtistPhoto';
import { TicketingCarousel } from '@/components/TicketingCarousel';
import { marketStyles as m } from '@/components/GoodsDemo';
import { demoArtists } from '@/lib/goods-demo';
import { favoriteOpenings } from '@/lib/favorite-openings';
import { useFavorites } from '@/lib/favorites';
import { colors } from '@/theme/tokens';

const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export function HomeArtists({ onSelect }: { onSelect: (name: string) => void }) {
  const { artists: favorites, isArtistFavorite, toggleArtist } = useFavorites();
  const profiles = useQueries({ queries: demoArtists.map((item) => ({ queryKey: ['artists', item.name], queryFn: () => getArtists(item.name), staleTime: 3600000, retry: false })) });
  const recommended = profiles.flatMap((profile, index) => {
    const match = profile.data?.find((artist) => [artist.name, ...artist.aliases].some((alias) => normalize(alias) === normalize(demoArtists[index].name)));
    return match ? [match] : [];
  });
  const artists = [...new Map([...favorites.map((artist) => recommended.find((item) => item.id === artist.id) ?? artist), ...recommended].map((artist) => [artist.id, artist])).values()];
  const openings = useQuery({ queryKey: ['ticket-openings'], queryFn: getTicketOpenings, enabled: favorites.length > 0, retry: false });
  const matched = favoriteOpenings(openings.data ?? [], favorites);
  return <View style={{ gap: 24 }}>
    <View style={m.section}>
      <Text style={m.sectionTitle}>내 최애를 찜해보세요!</Text>
      <Text style={m.subtitle}>하트를 누르면 선예매·일반예매 일정을 모아드려요.{`\n`}다른 가수도 위 검색창에서 찾아 찜할 수 있어요.</Text>
      {artists.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.list}>
        {artists.map((artist) => <View key={artist.id} style={s.artist}>
          <ArtistPhoto artist={artist} size={66} />
          <Pressable accessibilityRole="button" accessibilityLabel={`${artist.name} 굿즈 모아보기`} onPress={() => onSelect(artist.name)}><Text numberOfLines={1} style={s.name}>{artist.name}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`${artist.name} 관심 아티스트 ${isArtistFavorite(artist.id) ? '해제' : '찜하기'}`} accessibilityState={{ selected: isArtistFavorite(artist.id) }} onPress={() => toggleArtist(artist)} style={[s.heart, isArtistFavorite(artist.id) && s.hearted]}><Ionicons name={isArtistFavorite(artist.id) ? 'heart' : 'heart-outline'} color={colors.primary} size={15} /><Text style={s.heartText}>{isArtistFavorite(artist.id) ? '찜했어요' : '찜하기'}</Text></Pressable>
        </View>)}
      </ScrollView> : null}
      {profiles.some((item) => item.isFetching) ? <View style={m.row}><ActivityIndicator size="small" color={colors.primary} /><Text style={m.subtitle}>공개 아티스트 프로필을 불러오고 있어요</Text></View> : null}
      {profiles.some((item) => item.isError) ? <View style={{ gap: 9 }}><Text style={s.error}>일부 아티스트 조회가 지연되고 있어요. 잠시 후 다시 시도해 주세요.</Text><Pressable accessibilityRole="button" onPress={() => profiles.filter((item) => item.isError).forEach((item) => item.refetch())}><Text style={m.link}>조회에 실패한 프로필 다시 불러오기</Text></Pressable></View> : null}
      <Text style={s.creditHint}>Spotify 표시는 아티스트 페이지로 연결돼요. ⓘ에서는 사진 출처를 확인할 수 있어요. 사진이 없으면 기본 아이콘으로 표시해요.</Text>
    </View>
    <View style={m.section}>
      <View style={m.between}><Text style={m.sectionTitle}>찜한 아티스트의 예매 일정</Text><Text style={s.count}>{favorites.length}명 찜</Text></View>
      {!favorites.length ? <View style={s.empty}><Ionicons name="heart-outline" color={colors.primary} size={29} /><Text style={s.emptyTitle}>좋아하는 가수를 먼저 찜해보세요</Text><Text style={m.subtitle}>위의 하트를 누르거나 검색해서 추가해 주세요.{`\n`}확인된 예매 일정이 있으면 여기에 보여드릴게요.</Text></View>
        : <>
          <Text style={m.subtitle}>{favorites.map((artist) => artist.name).join(' · ')}{`\n`}공식 출처를 확인한 예매 일정만 표시해요.</Text>
          {openings.isPending ? <ActivityIndicator color={colors.primary} /> : openings.isError ? <View style={s.empty}><Text style={m.subtitle}>일정을 불러오지 못했어요. 없는 일정으로 처리하지 않을게요.</Text><Pressable accessibilityRole="button" onPress={() => openings.refetch()}><Text style={m.link}>예매 일정 다시 불러오기</Text></Pressable></View> : <>
            <TicketingCarousel openings={matched} scheduleType="FAN_PRESALE" title="곧 열리는 선예매" />
            <TicketingCarousel openings={matched} scheduleType="GENERAL_SALE" title="곧 열리는 일반예매" />
          </>}
        </>}
    </View>
  </View>;
}

const s = StyleSheet.create({
  list: { gap: 15, paddingVertical: 5 },
  artist: { width: 83, alignItems: 'center', gap: 12 },
  name: { color: colors.text, fontSize: 10, fontWeight: '800', maxWidth: 83 },
  heart: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: '#F1EDF7', borderRadius: 15 },
  hearted: { backgroundColor: '#E9DFFD' },
  heartText: { color: colors.primary, fontSize: 9, fontWeight: '700' },
  creditHint: { fontSize: 9, color: '#92839D', lineHeight: 16 },
  error: { fontSize: 11, color: '#AA5E5E', lineHeight: 19 },
  count: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  empty: { padding: 21, borderRadius: 20, gap: 12, backgroundColor: '#F1EDF8' },
  emptyTitle: { fontSize: 14, color: '#62517B', fontWeight: '800' },
});
