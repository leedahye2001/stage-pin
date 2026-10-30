import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsiveLayout, responsiveStyles } from '@/lib/use-responsive-layout';

import { ConcertCard } from '@/components/ConcertCard';
import { MemberLoginCard } from '@/components/MemberLoginCard';
import { ArtistPhoto } from '@/components/ArtistPhoto';
import { GoodsCard, marketStyles } from '@/components/GoodsDemo';
import { useGoodsDemo } from '@/lib/goods-demo-state';
import { useFavorites } from '@/lib/favorites';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function MyScreen() {
  const { isWide } = useResponsiveLayout();
  const { artists, concerts, isConcertFavorite, toggleArtist, toggleConcert } = useFavorites();
  const { items, saved, requested } = useGoodsDemo();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, isWide && responsiveStyles.reading]}>
        <View>
          <Text style={styles.title}>MY</Text>
        </View>

        <MemberLoginCard />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>데모 신청 내역 · {requested.length}</Text>
          <Text style={styles.emptyText}>상대방에게 전송되지 않으며 새로고침 시 초기화돼요.</Text>
          {requested.length ? items.filter((item) => requested.includes(item.id)).map((item) => <Pressable accessibilityRole="button" key={item.id} onPress={() => router.push({ pathname: '/goods/[id]', params: { id: item.id } })} style={styles.emptyCard}><Ionicons name="swap-horizontal" color={colors.primary} size={23} /><View style={{ flex: 1 }}><Text style={{ color: colors.text, fontWeight: '700', lineHeight: 22 }}>{item.title}</Text><Text style={styles.emptyText}>{item.kind} 신청 미리보기 · 데모 보관</Text></View><Ionicons name="chevron-forward" color={colors.primary} size={17} /></Pressable>) : <EmptyFavorite message="굿즈 상세에서 데모 신청을 남겨보세요." />}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>찜한 굿즈 · {saved.length}</Text>
          <View style={marketStyles.grid}>{items.filter((item) => saved.includes(item.id)).map((item) => <View key={item.id} style={marketStyles.gridItem}><GoodsCard item={item} /></View>)}</View>
          {!saved.length ? <EmptyFavorite message="마음에 드는 굿즈의 하트를 눌러보세요." /> : null}
        </View>

        <View style={styles.section}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/admin/notices')} style={styles.emptyCard}>
            <Ionicons color={colors.primary} name="sparkles" size={24} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>AI 공연 공지 분석</Text>
              <Text style={styles.emptyText}>공지를 일정으로 정리하고 검수해요 · 관리자</Text>
            </View>
            <Ionicons color={colors.primary} name="chevron-forward" size={18} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>관심 아티스트</Text>
            <Text style={styles.count}>{artists.length}</Text>
          </View>
          {artists.length ? (
            <ScrollView contentContainerStyle={styles.artistList} horizontal showsHorizontalScrollIndicator={false}>
              {artists.map((artist) => (
                <View key={artist.id} style={styles.artistCard}>
                  <ArtistPhoto artist={artist} size={68} />
                  <Text numberOfLines={1} style={styles.artistName}>{artist.name}</Text>
                  <Pressable
                    accessibilityLabel={`${artist.name} 관심 해제`}
                    onPress={() => toggleArtist(artist)}
                    style={styles.removeButton}
                  >
                    <Ionicons color={colors.primary} name="heart" size={18} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : (
            <EmptyFavorite message="홈에서 아티스트를 검색한 뒤 하트를 눌러보세요." />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>찜한 공연</Text>
            <Text style={styles.count}>{concerts.length}</Text>
          </View>
          {concerts.length ? (
            <ScrollView contentContainerStyle={styles.concertList} horizontal showsHorizontalScrollIndicator={false}>
              {concerts.map((concert) => (
                <ConcertCard
                  concert={concert}
                  favorite={isConcertFavorite(concert.id)}
                  key={concert.id}
                  onFavoriteToggle={() => toggleConcert(concert)}
                  onPress={() => router.push({
                    pathname: '/concerts/[id]',
                    params: { id: concert.id, genre: concert.genre },
                  })}
                />
              ))}
            </ScrollView>
          ) : (
            <EmptyFavorite message="다가오는 무대에서 보고 싶은 공연을 찜해보세요." />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyFavorite({ message }: { message: string }) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons color={colors.primary} name="heart-outline" size={24} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.xl, padding: spacing.md, paddingBottom: spacing.xl },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  section: { gap: spacing.md },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: typography.title, fontWeight: '800' },
  count: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  artistList: { gap: spacing.sm, paddingRight: spacing.md },
  artistCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    position: 'relative',
    width: 128,
  },
  artistImage: { borderRadius: radius.pill, height: 68, width: 68 },
  artistFallback: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  artistName: { color: colors.text, fontWeight: '800', maxWidth: '100%' },
  removeButton: {
    alignItems: 'center',
    backgroundColor: colors.button,
    borderRadius: radius.pill,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    width: 32,
  },
  concertList: { gap: spacing.md, paddingRight: spacing.md },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  emptyText: { color: colors.textMuted, flex: 1, lineHeight: 20 },
});
