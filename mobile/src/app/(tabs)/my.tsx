import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConcertCard } from '@/components/ConcertCard';
import { MemberLoginCard } from '@/components/MemberLoginCard';
import { ArtistPhoto, ArtistPhotoCredits } from '@/components/ArtistPhoto';
import { GoodsCard, marketStyles as m } from '@/components/GoodsDemo';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { getCurrentMember } from '@/api/auth';
import { getMyGoods, goodsBase } from '@/api/goods';
import { goodsItem } from '@/lib/goods-listings';
import { useGoods } from '@/lib/goods-state';
import { useFavorites } from '@/lib/favorites';
import { collectionViewState, memberCollections } from '@/lib/my-collections';
import { useResponsiveLayout, responsiveStyles } from '@/lib/use-responsive-layout';
import { colors, radius } from '@/theme/tokens';

export default function MyScreen() {
  const layout = useResponsiveLayout();
  const favorites = useFavorites();
  const goods = useGoods();
  const member = useQuery({ queryKey: ['current-member'], queryFn: getCurrentMember, retry: false });
  const mine = useInfiniteQuery({
    queryKey: ['my-goods', member.data?.id], enabled: Boolean(member.data), initialPageParam: 0,
    queryFn: ({ pageParam }) => getMyGoods(pageParam), getNextPageParam: (last, pages) => last.length === 24 ? pages.length : undefined,
    retry: false, staleTime: 30000,
  });
  const myGoods = member.data ? mine.data?.pages.flat().map(item => goodsItem(item, goodsBase())) ?? [] : [];
  const savedGoods = goods.items.filter(item => goods.saved.includes(item.id));

  return <SafeAreaView edges={['top']} style={m.safe}>
    <ScrollView contentContainerStyle={[m.content, layout.isWide && responsiveStyles.reading]} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={s.title}>MY</Text>
      <MemberLoginCard guestMessage="로그인하면 내가 등록한 굿즈를 확인할 수 있어요." />
      {memberCollections(member.data?.id, member.isError).map(section => {
        const { id, label, skeleton } = section;
        const count = id === 'concerts' ? favorites.concerts.length : id === 'artists' ? favorites.artists.length
          : id === 'listings' ? myGoods.length : savedGoods.length;
        const pending = id === 'listings' ? mine.isPending : id === 'goods' ? goods.saved.length > 0 && goods.loading : !favorites.ready;
        const failed = member.isError || (id === 'listings' ? mine.isError : id === 'goods'
          ? goods.saved.length > 0 && Boolean(goods.error) : !favorites.ready && Boolean(favorites.error));
        const state = collectionViewState({ authPending: member.isPending,
          requiresLogin: id === 'listings' && member.data === null && !member.isError, hasItems: count > 0, pending, failed });
        const retry = () => {
          if (member.isError) { void member.refetch(); return; }
          if (id === 'listings') void mine.refetch();
          else if (id === 'goods') goods.refresh();
          else favorites.retry();
        };
        const empty = id === 'concerts' ? { title: '찜한 공연이 없어요', action: '공연 둘러보기', path: '/discover' as const }
          : id === 'artists' ? { title: '관심 아티스트가 없어요', action: '아티스트 찾아보기', path: '/' as const }
          : id === 'listings' ? { title: '등록한 굿즈가 없어요', action: '굿즈 등록하기', path: '/goods/create' as const }
          : { title: '찜한 굿즈가 없어요', action: '굿즈 둘러보기', path: '/goods' as const };
        return <View key={id} style={s.section}>
          <View style={m.between}>
            <View style={m.row}><Text accessibilityRole="header" style={m.sectionTitle}>{label}</Text>
              {state === 'content' || state === 'empty' ? <Text style={s.count}>{count}</Text> : null}</View>
            {id === 'listings' && member.data && state === 'content' ? <Pressable accessibilityRole="button" accessibilityLabel="내 굿즈 등록하기" onPress={() => router.push('/goods/create')} style={s.button}><Text style={s.buttonText}>등록</Text></Pressable> : null}
          </View>
          {state === 'loading' ? <LoadingSkeleton kind={skeleton} list label={`${label} 불러오는 중`} /> : null}
          {state === 'error' || (state === 'content' && failed) ? <View style={s.emptyRow}>
            <Text accessibilityRole="alert" style={s.emptyText}>목록을 불러오지 못했어요.</Text>
            <Pressable accessibilityRole="button" onPress={retry} style={s.button}><Text style={s.buttonText}>다시 시도</Text></Pressable>
          </View> : null}
          {state === 'login' ? <Text style={s.emptyText}>로그인 후 확인할 수 있어요.</Text> : null}
          {state === 'empty' ? <View style={s.emptyRow}>
            <Text style={s.emptyText}>{empty.title}</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push(empty.path)} style={s.button}><Text style={s.buttonText}>{empty.action}</Text></Pressable>
          </View> : null}
          {state === 'content' && id === 'concerts' ? favorites.concerts.map(concert =>
            <ConcertCard key={concert.id} compact concert={concert} favorite={favorites.isConcertFavorite(concert.id)}
              onFavoriteToggle={() => favorites.toggleConcert(concert)}
              onPress={() => router.push({ pathname: '/concerts/[id]', params: { id: concert.id, genre: concert.genre } })} />) : null}
          {state === 'content' && id === 'artists' ? <>
            {favorites.artists.map(artist => <View key={artist.id} style={s.artistRow}>
              <ArtistPhoto artist={artist} size={66} showCredit={false} />
              <Pressable accessibilityRole="button" accessibilityLabel={`${artist.name} 공연과 아티스트 보기`} style={s.artistLink}
                onPress={() => router.push({ pathname: '/artists/[id]', params: { id: artist.id, query: artist.searchName } })}>
                <Text numberOfLines={1} style={s.artistName}>{artist.name}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`${artist.name} 관심 아티스트 해제`}
                disabled={favorites.busy} onPress={() => favorites.toggleArtist(artist)} style={s.heart}>
                <Ionicons name="heart" size={20} color={colors.primary} />
              </Pressable>
            </View>)}
            <ArtistPhotoCredits artists={favorites.artists} />
          </> : null}
          {state === 'content' && (id === 'listings' || id === 'goods') ?
            (id === 'listings' ? myGoods : savedGoods).map(item => <GoodsCard key={item.id} item={item} compact />) : null}
          {id === 'listings' && member.data && state === 'content' && mine.hasNextPage ? <Pressable accessibilityRole="button"
            disabled={mine.isFetchingNextPage} onPress={() => void mine.fetchNextPage()} style={s.more}>
            <Text style={s.buttonText}>{mine.isFetchingNextPage ? '불러오는 중' : '더 보기'}</Text>
          </Pressable> : null}
        </View>;
      })}
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  section: { gap: 10 },
  count: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  button: { backgroundColor: colors.button, borderRadius: radius.pill, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: colors.buttonText, fontSize: 12, fontWeight: '700' },
  emptyRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingVertical: 8 },
  emptyText: { flex: 1, minWidth: 130, color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  artistRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  artistLink: { flex: 1, minWidth: 0, minHeight: 66, justifyContent: 'center' },
  artistName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  heart: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  more: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill },
});
