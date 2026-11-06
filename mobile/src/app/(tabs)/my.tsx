import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { collectionViewState, myCollections, type MyCollection } from '@/lib/my-collections';
import { useResponsiveLayout, responsiveStyles } from '@/lib/use-responsive-layout';
import { colors, radius, spacing } from '@/theme/tokens';

export default function MyScreen() {
  const layout = useResponsiveLayout();
  const favorites = useFavorites();
  const goods = useGoods();
  const [tab, setTab] = useState<MyCollection>('concerts');
  const [confirmImport, setConfirmImport] = useState(false);
  const member = useQuery({ queryKey: ['current-member'], queryFn: getCurrentMember, retry: false });
  const mine = useInfiniteQuery({
    queryKey: ['my-goods', member.data?.id], enabled: Boolean(member.data) && tab === 'listings', initialPageParam: 0,
    queryFn: ({ pageParam }) => getMyGoods(pageParam), getNextPageParam: (last, pages) => last.length === 24 ? pages.length : undefined,
    retry: false, staleTime: 30000,
  });
  const myGoods = member.data ? mine.data?.pages.flat().map(item => goodsItem(item, goodsBase())) ?? [] : [];
  const savedGoods = goods.items.filter(item => goods.saved.includes(item.id));
  const selected = myCollections.find(item => item.id === tab)!;
  const count = tab === 'concerts' ? favorites.concerts.length : tab === 'artists' ? favorites.artists.length
    : tab === 'listings' ? myGoods.length : savedGoods.length;
  const pending = tab === 'listings' ? mine.isPending : tab === 'goods' ? goods.saved.length > 0 && goods.loading : !favorites.ready;
  const failed = member.isError || (tab === 'listings' ? mine.isError : tab === 'goods'
    ? goods.saved.length > 0 && Boolean(goods.error) : !favorites.ready && Boolean(favorites.error));
  const state = collectionViewState({ authPending: member.isPending, requiresLogin: tab === 'listings' && member.data === null && !member.isError,
    hasItems: count > 0, pending, failed });
  const retry = () => {
    if (member.isError) { void member.refetch(); return; }
    if (tab === 'listings') void mine.refetch();
    else if (tab === 'goods') goods.refresh();
    else favorites.retry();
  };
  const gridItem = [m.gridItem, layout.isWide && { width: layout.cardWidth, maxWidth: layout.cardWidth, flexGrow: 0 }];
  const empty = tab === 'concerts' ? { title: '찜한 공연이 없어요', action: '공연 둘러보기', path: '/discover' as const }
    : tab === 'artists' ? { title: '관심 아티스트가 없어요', action: '아티스트 찾아보기', path: '/' as const }
    : tab === 'listings' ? { title: '등록한 굿즈가 없어요', action: '굿즈 등록하기', path: '/goods/create' as const }
    : { title: '찜한 굿즈가 없어요', action: '굿즈 둘러보기', path: '/goods' as const };

  return <SafeAreaView edges={['top']} style={m.safe}>
    <ScrollView contentContainerStyle={[m.content, layout.isWide && responsiveStyles.content]} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={s.title}>MY</Text>
      <MemberLoginCard />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={m.chips}>
        {myCollections.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`MY ${item.label} 보기`}
          accessibilityState={{ selected: tab === item.id }} onPress={() => setTab(item.id)} style={[m.chip, tab === item.id && m.chipSelected]}>
          <Text style={[m.chipText, tab === item.id && m.chipSelectedText]}>{item.label}</Text>
        </Pressable>)}
      </ScrollView>

      <View style={m.section}>
        <View style={m.between}>
          <View style={m.row}><Text accessibilityRole="header" style={m.sectionTitle}>{selected.label}</Text>
            {state === 'content' || state === 'empty' ? <Text style={s.count}>{count}</Text> : null}</View>
          {tab === 'listings' && member.data && state === 'content' ? <Pressable accessibilityRole="button" accessibilityLabel="내 굿즈 등록하기" onPress={() => router.push('/goods/create')} style={s.button}><Text style={s.buttonText}>등록</Text></Pressable> : null}
        </View>
        {state === 'loading' ? <LoadingSkeleton kind={selected.skeleton} grid={tab !== 'artists'} label={`${selected.label} 불러오는 중`} /> : null}
        {state === 'error' || (state === 'content' && failed) ? <View style={m.empty}>
          <Text accessibilityRole="alert" style={m.subtitle}>목록을 불러오지 못했어요.</Text>
          <Pressable accessibilityRole="button" onPress={retry} style={s.button}><Text style={s.buttonText}>다시 시도</Text></Pressable>
        </View> : null}
        {state === 'login' ? <View style={m.empty}><Ionicons name="person-outline" color={colors.textMuted} size={28} /><Text style={s.emptyTitle}>로그인 후 확인할 수 있어요</Text></View> : null}
        {state === 'empty' ? <View style={m.empty}>
          <Ionicons name={tab === 'listings' ? 'bag-handle-outline' : 'heart-outline'} color={colors.textMuted} size={28} />
          <Text style={s.emptyTitle}>{empty.title}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push(empty.path)} style={s.button}><Text style={s.buttonText}>{empty.action}</Text></Pressable>
        </View> : null}
        {state === 'content' && tab === 'concerts' ? <View style={m.grid}>
          {favorites.concerts.map(concert => <View key={concert.id} style={gridItem}>
            <ConcertCard fluid concert={concert} favorite={favorites.isConcertFavorite(concert.id)} onFavoriteToggle={() => favorites.toggleConcert(concert)}
              onPress={() => router.push({ pathname: '/concerts/[id]', params: { id: concert.id, genre: concert.genre } })} />
          </View>)}
        </View> : null}
        {state === 'content' && tab === 'artists' ? <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.artists}>
            {favorites.artists.map(artist => <View key={artist.id} style={s.artist}>
              <ArtistPhoto artist={artist} size={66} showCredit={false} favorite onFavoriteToggle={() => favorites.toggleArtist(artist)} />
              <Pressable accessibilityRole="button" accessibilityLabel={`${artist.name} 공연과 아티스트 보기`}
                onPress={() => router.push({ pathname: '/artists/[id]', params: { id: artist.id, query: artist.searchName } })}>
                <Text numberOfLines={1} style={s.artistName}>{artist.name}</Text>
              </Pressable>
            </View>)}
          </ScrollView>
          <ArtistPhotoCredits artists={favorites.artists} />
        </> : null}
        {state === 'content' && (tab === 'listings' || tab === 'goods') ? <View style={m.grid}>
          {(tab === 'listings' ? myGoods : savedGoods).map(item => <View key={item.id} style={gridItem}><GoodsCard item={item} /></View>)}
        </View> : null}
        {tab === 'listings' && member.data && state === 'content' && mine.hasNextPage ? <Pressable accessibilityRole="button"
          disabled={mine.isFetchingNextPage} onPress={() => void mine.fetchNextPage()} style={s.more}>
          <Text style={s.buttonText}>{mine.isFetchingNextPage ? '불러오는 중' : '더 보기'}</Text>
        </Pressable> : null}
      </View>

      <View style={s.utilities}>
        {member.data && favorites.guestCount > 0 ? <Pressable accessibilityRole="button" accessibilityLabel="기기 찜 가져오기"
          disabled={!favorites.ready || favorites.busy} onPress={() => setConfirmImport(true)} style={s.utility}>
          <Ionicons name="download-outline" size={19} color={colors.textMuted} />
          <Text style={s.utilityText}>{favorites.busy ? '저장 중' : '기기 찜 가져오기'}</Text><Text style={m.subtitle}>{favorites.guestCount}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable> : null}
        <Pressable accessibilityRole="button" accessibilityLabel="관리자 공지 검수" onPress={() => router.push('/admin/notices')} style={s.utility}>
          <Ionicons name="document-text-outline" size={19} color={colors.textMuted} /><Text style={s.utilityText}>관리자 공지 검수</Text><Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      </View>
    </ScrollView>

    <Modal visible={confirmImport} transparent animationType="fade" onRequestClose={() => setConfirmImport(false)}>
      <View style={s.backdrop}><View accessibilityViewIsModal style={s.dialog}>
        <Text accessibilityRole="header" style={m.sectionTitle}>기기 찜 가져오기</Text>
        <Text style={s.dialogText}>이 기기의 찜 {favorites.guestCount}개를 현재 계정에 추가할까요?</Text>
        <View style={s.dialogActions}>
          <Pressable accessibilityRole="button" onPress={() => setConfirmImport(false)} style={s.button}><Text style={s.buttonText}>취소</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={!member.data || !favorites.ready || favorites.busy}
            onPress={() => { favorites.importGuest(); setConfirmImport(false); setTab('artists'); }} style={[s.button, s.primaryButton]}>
            <Text style={s.primaryText}>가져오기</Text>
          </Pressable>
        </View>
      </View></View>
    </Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  count: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  button: { backgroundColor: colors.button, borderRadius: radius.pill, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: colors.buttonText, fontSize: 12, fontWeight: '700' },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  artists: { gap: 16, paddingVertical: spacing.xs },
  artist: { width: 83, alignItems: 'center', gap: spacing.sm },
  artistName: { color: colors.text, fontSize: 12, fontWeight: '700', maxWidth: 83 },
  more: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill },
  utilities: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  utility: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 52 },
  utilityText: { flex: 1, color: colors.textMuted, fontSize: 13 },
  backdrop: { flex: 1, backgroundColor: '#20212466', justifyContent: 'center', padding: spacing.lg, alignItems: 'center' },
  dialog: { width: '100%', maxWidth: 400, backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, gap: spacing.lg },
  dialogText: { color: colors.text, fontSize: 14, lineHeight: 22 },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  primaryButton: { backgroundColor: colors.primary },
  primaryText: { color: colors.white, fontSize: 12, fontWeight: '700' },
});
