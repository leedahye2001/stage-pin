import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getConcerts } from '@/api/concerts';
import { ConcertCard } from '@/components/ConcertCard';
import { ConcertMap } from '@/components/ConcertMap';
import { useFavorites } from '@/lib/favorites';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function PerformanceSearchScreen() {
  const params = useLocalSearchParams<{ query: string }>();
  const query = Array.isArray(params.query) ? params.query[0] : params.query;
  const { isConcertFavorite, toggleConcert } = useFavorites();
  const concertsQuery = useQuery({
    queryKey: ['concerts', 'POPULAR_MUSIC', 'search-page', query],
    queryFn: () => getConcerts('POPULAR_MUSIC', query),
    enabled: Boolean(query),
  });
  const concerts = concertsQuery.data ?? [];
  const openConcert = (id: string) => {
    router.push({ pathname: '/concerts/[id]', params: { id, genre: 'POPULAR_MUSIC' } });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>PERFORMANCE SEARCH</Text>
          <Text style={styles.title}>‘{query}’ 공연 검색</Text>
          <Text style={styles.description}>예정 공연과 지난 공연을 함께 모았어요.</Text>
        </View>

        {concertsQuery.isPending ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.muted}>KOPIS 공연을 찾는 중이에요.</Text>
          </View>
        ) : concertsQuery.isError ? (
          <Text style={styles.empty}>공연 검색 결과를 불러오지 못했어요.</Text>
        ) : concerts.length ? (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>검색된 공연</Text>
                <Text style={styles.count}>{concerts.length}</Text>
              </View>
              <FlatList
                contentContainerStyle={styles.concertList}
                data={concerts}
                horizontal
                keyExtractor={(concert) => concert.id}
                renderItem={({ item }) => (
                  <ConcertCard
                    concert={item}
                    favorite={isConcertFavorite(item.id)}
                    onFavoriteToggle={() => toggleConcert(item)}
                    onPress={() => openConcert(item.id)}
                  />
                )}
                showsHorizontalScrollIndicator={false}
              />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>공연 장소 한눈에 보기</Text>
              <Text style={styles.caption}>핀을 누르면 해당 공연의 상세 정보를 볼 수 있어요.</Text>
              <ConcertMap concerts={concerts} onSelect={openConcert} />
            </View>
          </>
        ) : (
          <Text style={styles.empty}>‘{query}’로 찾은 KOPIS 공연이 아직 없어요.</Text>
        )}

        {concerts.some((concert) => concert.source === 'KOPIS') ? (
          <Text style={styles.attribution}>공연 데이터: 공연예술통합전산망(KOPIS)</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.xl, padding: spacing.md, paddingBottom: spacing.xl },
  hero: { backgroundColor: colors.primarySoft, borderRadius: radius.lg, gap: spacing.xs, padding: spacing.lg },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 25, fontWeight: '900' },
  description: { color: colors.textMuted, fontSize: typography.caption },
  centered: { alignItems: 'center', gap: spacing.md, paddingVertical: 80 },
  muted: { color: colors.textMuted },
  section: { gap: spacing.md },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: typography.title, fontWeight: '900' },
  caption: { color: colors.textMuted, fontSize: typography.caption, marginTop: -spacing.sm },
  count: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, color: colors.primary, fontSize: 12, fontWeight: '800', overflow: 'hidden', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  concertList: { gap: spacing.md, paddingRight: spacing.md },
  empty: { color: colors.textMuted, lineHeight: 21, paddingVertical: 80, textAlign: 'center' },
  attribution: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
});
