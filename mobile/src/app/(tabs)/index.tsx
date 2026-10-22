import { useQuery } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getConcerts, type FanCategory } from '@/api/concerts';
import { ConcertCard } from '@/components/ConcertCard';
import { ConcertMap } from '@/components/ConcertMap';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type FanFilter = FanCategory | 'ALL';

const fanFilters: { value: FanFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'IDOL', label: '아이돌' },
  { value: 'SOLO', label: '솔로' },
  { value: 'BAND', label: '밴드' },
];

export default function HomeScreen() {
  const [fanFilter, setFanFilter] = useState<FanFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 500);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const serverQuery = debouncedQuery.length >= 2 ? debouncedQuery : '';
  const concertsQuery = useQuery({
    queryKey: ['concerts', 'POPULAR_MUSIC', serverQuery],
    queryFn: () => getConcerts('POPULAR_MUSIC', serverQuery || undefined),
    placeholderData: (previousData) => previousData,
  });

  const openConcert = (id: string) => {
    router.push({ pathname: '/concerts/[id]', params: { id, genre: 'POPULAR_MUSIC' } });
  };

  if (concertsQuery.isPending) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>공연 지도를 불러오는 중이에요.</Text>
      </SafeAreaView>
    );
  }

  if (concertsQuery.isError) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>공연 정보를 불러오지 못했어요.</Text>
        <Text style={styles.errorMessage}>백엔드 연결과 EXPO_PUBLIC_API_URL을 확인해 주세요.</Text>
        <Pressable onPress={() => concertsQuery.refetch()} style={styles.retryButton}>
          <Text style={styles.retryLabel}>다시 시도</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const categorizedConcerts = fanFilter === 'ALL'
    ? concertsQuery.data
    : concertsQuery.data.filter((concert) => concert.fanCategory === fanFilter);
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('ko-KR');
  const concerts = normalizedQuery
    ? categorizedConcerts.filter((concert) =>
        [
          concert.title,
          concert.venue.name,
          concert.venue.city,
          ...concert.artists.map((artist) => artist.name),
        ].some((value) => value.toLocaleLowerCase('ko-KR').includes(normalizedQuery)),
      )
    : categorizedConcerts;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={concerts}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(concert) => concert.id}
        ListFooterComponent={
          concertsQuery.data.some((concert) => concert.source === 'KOPIS') ? (
            <Text style={styles.attribution}>공연 데이터: 공연예술통합전산망(KOPIS)</Text>
          ) : undefined
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>STAGEPIN</Text>
              <Text style={styles.hero}>다음 무대를{`\n`}놓치지 마세요.</Text>
              <Text style={styles.subtitle}>공연과 티켓팅 일정을 한 지도에서 확인해요.</Text>
            </View>

            <View style={styles.searchBox}>
              <Ionicons color={colors.textMuted} name="search" size={20} />
              <TextInput
                accessibilityLabel="공연 검색"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setSearchQuery}
                placeholder="아티스트, 공연명, 공연장을 검색해보세요"
                placeholderTextColor={colors.textMuted}
                returnKeyType="search"
                style={styles.searchInput}
                value={searchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  accessibilityLabel="검색어 지우기"
                  hitSlop={10}
                  onPress={() => setSearchQuery('')}
                >
                  <Ionicons color={colors.textMuted} name="close-circle" size={20} />
                </Pressable>
              )}
            </View>

            <ScrollView
              contentContainerStyle={styles.genreList}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {fanFilters.map((item) => {
                const selected = item.value === fanFilter;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={item.value}
                    onPress={() => setFanFilter(item.value)}
                    style={[styles.genreChip, selected && styles.genreChipSelected]}
                  >
                    <Text style={[styles.genreLabel, selected && styles.genreLabelSelected]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.classificationNote}>KOPIS 공연명·출연진 기준 자동 분류</Text>

            {!normalizedQuery && <ConcertMap concerts={concerts} onSelect={openConcert} />}

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>{normalizedQuery ? '검색 결과' : '예정 공연'}</Text>
              <Text style={styles.count}>{concerts.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {concertsQuery.isFetching && serverQuery
              ? 'KOPIS 공연 기록을 찾는 중이에요.'
              : normalizedQuery
              ? `‘${searchQuery.trim()}’ 검색 결과가 없어요.`
              : '해당 분류의 예정 공연이 아직 없어요.'}
          </Text>
        }
        renderItem={({ item }) => <ConcertCard concert={item} onPress={() => openConcert(item.id)} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  hero: {
    color: colors.text,
    fontSize: typography.hero,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 38,
    marginTop: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginTop: spacing.sm,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    paddingVertical: 14,
  },
  genreList: {
    gap: spacing.sm,
  },
  genreChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  genreChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genreLabel: {
    color: colors.textMuted,
    fontWeight: '800',
  },
  genreLabelSelected: {
    color: colors.white,
  },
  classificationNote: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: -spacing.md,
  },
  empty: {
    color: colors.textMuted,
    paddingVertical: spacing.xl,
    textAlign: 'center',
  },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
  },
  count: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  separator: {
    height: spacing.sm,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  errorTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  retryLabel: {
    color: colors.white,
    fontWeight: '800',
  },
  attribution: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
